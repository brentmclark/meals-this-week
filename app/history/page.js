"use client";

import { useEffect, useState } from "react";

export default function HistoryPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);

  function load(nextQ = q) {
    fetch(`/api/history?q=${encodeURIComponent(nextQ)}`)
      .then((r) => r.json())
      .then((data) => setItems(data.items || []));
  }

  useEffect(() => {
    load("");
  }, []);

  return (
    <section>
      <h1>Meal History</h1>
      <form
        className="row"
        style={{ marginBottom: "0.7rem" }}
        onSubmit={(e) => {
          e.preventDefault();
          load(q);
        }}
      >
        <input type="text" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by meal" />
        <button type="submit">Search</button>
        <button
          type="button"
          onClick={() => {
            setQ("");
            load("");
          }}
        >
          Clear
        </button>
      </form>
      <div className="card">
        {items.length === 0 ? <p className="muted">No history yet.</p> : null}
        {items.map((item) => (
          <p key={item.id} style={{ margin: "0.3rem 0" }}>
            {item.occurred_on}: {item.meal_name}
          </p>
        ))}
      </div>
    </section>
  );
}
