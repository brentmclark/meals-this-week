"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { formatDay, startOfWeek, toISODate } from "../lib/date";

function shiftDate(input, days) {
  const d = new Date(`${input}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toISODate(d);
}

function formatThaw(label, leadDays) {
  if (!label) return null;
  if (leadDays === null || leadDays === undefined) return label;
  const dayText = leadDays === 1 ? "1 day before" : `${leadDays} days before`;
  return `${label} (${dayText})`;
}

export default function WeeklyBoard({ kitchenMode = false }) {
  const initialStart = useMemo(() => toISODate(startOfWeek(new Date(), 0)), []);
  const [weekStart, setWeekStart] = useState(initialStart);
  const [days, setDays] = useState([]);
  const [staged, setStaged] = useState([]);

  function load(start = weekStart) {
    fetch(`/api/week?start=${start}`)
      .then((r) => r.json())
      .then((data) => {
        setWeekStart(data.weekStart);
        setDays(data.days || []);
        setStaged(data.staged || []);
      });
  }

  useEffect(() => {
    load(initialStart);
  }, [initialStart]);

  async function setNightType(date, nightType) {
    const res = await fetch(`/api/day/${date}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ nightType })
    });

    if (res.ok) load();
  }

  return (
    <>
      <section className="card" style={{ marginBottom: "0.8rem" }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h1 style={{ margin: 0 }}>Week of {weekStart}</h1>
            <p className="muted" style={{ margin: 0 }}>Central dinner plan for the household</p>
          </div>
          <div className="row">
            <button onClick={() => load(shiftDate(weekStart, -7))}>Prev</button>
            <button onClick={() => load(shiftDate(weekStart, 7))}>Next</button>
          </div>
        </div>
      </section>

      <section className="week-grid">
        {days.map((day) => (
          <article key={day.date} className={`day-card ${day.nightType}`}>
            <div className="day-top">
              <strong>{formatDay(day.date)}</strong>
              {kitchenMode ? null : (
                <select value={day.nightType} onChange={(e) => setNightType(day.date, e.target.value)}>
                  <option value="normal">Normal</option>
                  <option value="quick">Quick</option>
                </select>
              )}
            </div>
            <p style={{ minHeight: 24, marginBottom: "0.3rem" }}>{day.mealName || "No meal set"}</p>
            {day.thawLabel ? <p className="muted">Thaw: {formatThaw(day.thawLabel, day.thawLeadDays)}</p> : null}
            {kitchenMode ? null : (
              <Link href={`/day/${day.date}`} className="link-button">
                Edit day
              </Link>
            )}
          </article>
        ))}
      </section>

      {kitchenMode ? null : (
        <section className="card" style={{ marginTop: "0.9rem" }}>
          <h3 style={{ marginTop: 0 }}>Staged meal ideas</h3>
          {staged.length === 0 ? <p className="muted">No staged items yet.</p> : null}
          {staged.map((item) => (
            <p key={item.id} className="muted" style={{ margin: "0.3rem 0" }}>
              {item.meal_name}
              {item.preferred_date ? ` (preferred ${item.preferred_date})` : ""}
            </p>
          ))}
        </section>
      )}
    </>
  );
}
