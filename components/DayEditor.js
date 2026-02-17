"use client";

import { useEffect, useState } from "react";

export default function DayEditor({ date, initial, onSaved }) {
  const [nightType, setNightType] = useState(initial?.nightType || "normal");
  const [mealName, setMealName] = useState(initial?.mealName || "");
  const [notes, setNotes] = useState(initial?.notes || "");
  const [thawMode, setThawMode] = useState(initial?.thawReminderLabel ? "custom" : "none");
  const [thawReminderLabel, setThawReminderLabel] = useState(initial?.thawReminderLabel || "");
  const [thawLeadDays, setThawLeadDays] = useState(initial?.thawLeadDays ?? 1);

  useEffect(() => {
    setNightType(initial?.nightType || "normal");
    setMealName(initial?.mealName || "");
    setNotes(initial?.notes || "");
    setThawMode(initial?.thawReminderLabel ? "custom" : "none");
    setThawReminderLabel(initial?.thawReminderLabel || "");
    setThawLeadDays(initial?.thawLeadDays ?? 1);
  }, [initial]);

  async function save() {
    const trimmedMealName = mealName.trim();
    const trimmedCustomLabel = thawReminderLabel.trim();
    const isNoReminder = thawMode === "none";
    const reminderLabel =
      thawMode === "meal" ? trimmedMealName : thawMode === "custom" ? trimmedCustomLabel : null;

    if (!isNoReminder && !reminderLabel) {
      alert("Enter a thaw reminder label or choose No thaw reminder.");
      return;
    }

    const res = await fetch(`/api/day/${date}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        nightType,
        mealName,
        notes,
        thawReminderLabel: isNoReminder ? null : reminderLabel,
        thawLeadDays: isNoReminder ? null : thawLeadDays
      })
    });

    if (!res.ok) {
      alert("Save failed");
      return;
    }

    const data = await res.json();
    if (onSaved) onSaved(data);
  }

  return (
    <div className="card">
      <div className="row" style={{ marginBottom: "0.5rem" }}>
        <select value={nightType} onChange={(e) => setNightType(e.target.value)}>
          <option value="normal">Normal night</option>
          <option value="quick">Quick night</option>
        </select>
      </div>

      <div className="row" style={{ marginBottom: "0.5rem" }}>
        <input
          type="text"
          value={mealName}
          onChange={(e) => setMealName(e.target.value)}
          placeholder="Dinner name"
          style={{ width: "100%" }}
        />
      </div>

      <div className="row" style={{ marginBottom: "0.5rem" }}>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes"
          rows={2}
          style={{ width: "100%" }}
        />
      </div>

      <div className="row" style={{ marginBottom: "0.5rem" }}>
        <select value={thawMode} onChange={(e) => setThawMode(e.target.value)}>
          <option value="none">No thaw reminder</option>
          <option value="meal">Use meal name</option>
          <option value="custom">Custom reminder label</option>
        </select>
      </div>

      {thawMode === "custom" ? (
        <div className="row" style={{ marginBottom: "0.5rem" }}>
          <input
            type="text"
            value={thawReminderLabel}
            onChange={(e) => setThawReminderLabel(e.target.value)}
            placeholder="Reminder label (ex: Potato & ham soup)"
            style={{ width: "100%" }}
          />
        </div>
      ) : null}

      {thawMode === "none" ? null : (
        <div className="row" style={{ marginBottom: "0.5rem", alignItems: "center" }}>
          <label htmlFor="thawLeadDays" className="muted">
            Remind me
          </label>
          <input
            id="thawLeadDays"
            type="number"
            min={0}
            max={14}
            value={thawLeadDays}
            onChange={(e) => setThawLeadDays(Math.max(0, Number(e.target.value) || 0))}
            style={{ width: 90 }}
          />
          <span className="muted">day(s) before</span>
        </div>
      )}

      <button className="primary" onClick={save}>
        Save
      </button>
    </div>
  );
}
