"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ passcode })
    });

    if (!res.ok) {
      setError("Passcode did not match.");
      return;
    }

    router.replace("/");
  }

  return (
    <section className="card" style={{ maxWidth: 430, margin: "10vh auto" }}>
      <h1>Meals This Week</h1>
      <p className="muted">Private family planner</p>
      <form onSubmit={onSubmit}>
        <div className="row" style={{ marginBottom: "0.75rem" }}>
          <input
            type="password"
            required
            placeholder="Family passcode"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>
        {error ? <p style={{ color: "#8f2121" }}>{error}</p> : null}
        <button className="primary" type="submit">
          Enter
        </button>
      </form>
    </section>
  );
}
