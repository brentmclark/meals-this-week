"use client";

import { useEffect, useState } from "react";

export default function StagedPage() {
  const [items, setItems] = useState([]);
  const [mealName, setMealName] = useState("");
  const [note, setNote] = useState("");

  function load() {
    fetch("/api/staged")
      .then((r) => r.json())
      .then((data) => setItems(data.items || []));
  }

  useEffect(() => {
    load();
  }, []);

  async function addItem(e) {
    e.preventDefault();
    const res = await fetch("/api/staged", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        mealName,
        note: note || null
      })
    });

    if (!res.ok) return;

    setMealName("");
    setNote("");
    load();
  }

  async function setStatus(id, status) {
    await fetch(`/api/staged/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status })
    });
    load();
  }

  return (
    <section>
      <h1>Staged Meals</h1>
      <form onSubmit={addItem} className="card" style={{ marginBottom: "0.9rem" }}>
        <div className="row" style={{ marginBottom: "0.5rem" }}>
          <input
            type="text"
            value={mealName}
            onChange={(e) => setMealName(e.target.value)}
            placeholder="Meal to stage"
            required
          />
        </div>
        <div className="row" style={{ marginBottom: "0.5rem" }}>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Optional note"
            style={{ width: "100%" }}
          />
        </div>
        <button className="primary" type="submit">
          Add staged meal
        </button>
      </form>

      <div className="card">
        {items.length === 0 ? <p className="muted">No staged items yet.</p> : null}
        {items.map((item) => (
          <div key={item.id} className="row" style={{ justifyContent: "space-between", marginBottom: "0.45rem" }}>
            <span>
              {item.meal_name}
              {item.preferred_date ? ` - preferred ${item.preferred_date}` : ""}
              {item.not_before_date ? ` - not before ${item.not_before_date}` : ""}
            </span>
            <span className="row">
              <button onClick={() => setStatus(item.id, "staged")}>Staged</button>
              <button onClick={() => setStatus(item.id, "planned")}>Planned</button>
              <button onClick={() => setStatus(item.id, "archived")}>Archive</button>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
