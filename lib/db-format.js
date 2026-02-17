export function toBigIntId(value) {
  if (value === null || value === undefined) return null;
  return BigInt(value);
}

export function toNumberId(value) {
  if (typeof value === "bigint") return Number(value);
  return value;
}

export function toISODateOnly(value) {
  if (!value) return null;
  return value.toISOString().slice(0, 10);
}
