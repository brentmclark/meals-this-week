export function toISODate(date) {
  return date.toISOString().slice(0, 10);
}

export function parseISODate(value) {
  const d = new Date(`${value}T00:00:00`);
  if (Number.isNaN(d.valueOf())) throw new Error("Invalid date");
  return d;
}

export function startOfWeek(input, weekStartsOn = 0) {
  const date = new Date(input);
  const day = date.getDay();
  const diff = (day - weekStartsOn + 7) % 7;
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function buildWeek(startDate) {
  const out = [];
  const start = parseISODate(startDate);
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    out.push(toISODate(d));
  }
  return out;
}

export function formatDay(dateText) {
  const d = parseISODate(dateText);
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric"
  });
}
