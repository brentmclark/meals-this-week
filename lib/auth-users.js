import fs from "fs/promises";
import path from "path";
import { passcodeHash } from "./auth";

function normalizeUser(raw, index) {
  if (!raw || typeof raw !== "object") {
    throw new Error(`Auth user at index ${index} must be an object`);
  }

  const email = typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
  if (!email) {
    throw new Error(`Auth user at index ${index} is missing a valid "email"`);
  }

  const login = typeof raw.login === "string" && raw.login.trim()
    ? raw.login.trim().toLowerCase()
    : email;
  const name =
    typeof raw.name === "string" && raw.name.trim() ? raw.name.trim() : email.split("@")[0];
  const role = raw.role === "admin" || raw.role === "manager" ? raw.role : "member";
  const storedHash = typeof raw.passcodeHash === "string" ? raw.passcodeHash.trim().toLowerCase() : "";

  if (!/^[a-f0-9]{64}$/.test(storedHash)) {
    throw new Error(`Auth user at index ${index} has an invalid "passcodeHash"`);
  }

  return { email, login, name, role, passcodeHash: storedHash };
}

function parseUsers(jsonText, sourceLabel) {
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error(`Unable to parse ${sourceLabel} as JSON`);
  }

  if (!Array.isArray(parsed)) {
    throw new Error(`${sourceLabel} must be a JSON array`);
  }

  const users = parsed.map((raw, index) => normalizeUser(raw, index));
  const seen = new Set();
  for (const user of users) {
    for (const key of [user.login, user.email]) {
      if (seen.has(key)) {
        throw new Error(`Duplicate auth user identifier "${key}" in ${sourceLabel}`);
      }
      seen.add(key);
    }
  }
  return users;
}

async function readUsersFromFile(filePath) {
  if (!filePath) return [];
  const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  const raw = await fs.readFile(resolvedPath, "utf8");
  return parseUsers(raw, `AUTH_USERS_FILE (${filePath})`);
}

export async function getConfiguredAuthUsers() {
  if (process.env.AUTH_USERS_JSON) {
    return parseUsers(process.env.AUTH_USERS_JSON, "AUTH_USERS_JSON");
  }
  if (process.env.AUTH_USERS_FILE) {
    return readUsersFromFile(process.env.AUTH_USERS_FILE);
  }
  return [];
}

export async function authenticateConfiguredUser(identifier, passcode) {
  const users = await getConfiguredAuthUsers();
  if (users.length === 0) return { mode: "single-passcode" };

  const key = typeof identifier === "string" ? identifier.trim().toLowerCase() : "";
  if (!key) return { mode: "multi-user", ok: false, reason: "missing-identifier" };

  const user = users.find((item) => item.login === key || item.email === key);
  if (!user) return { mode: "multi-user", ok: false, reason: "invalid-credentials" };

  const hash = passcodeHash(passcode);
  if (hash !== user.passcodeHash) {
    return { mode: "multi-user", ok: false, reason: "invalid-credentials" };
  }

  return { mode: "multi-user", ok: true, user };
}
