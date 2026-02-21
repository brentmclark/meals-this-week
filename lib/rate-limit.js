const buckets = new Map();

function sweep(now) {
  for (const [key, value] of buckets.entries()) {
    if (value.resetAt <= now) buckets.delete(key);
  }
}

export function checkRateLimit({ key, limit, windowMs }) {
  const now = Date.now();
  sweep(now);

  const entry = buckets.get(key);
  if (!entry || entry.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfterMs: windowMs };
  }

  entry.count += 1;
  buckets.set(key, entry);
  if (entry.count > limit) {
    return { ok: false, remaining: 0, retryAfterMs: Math.max(entry.resetAt - now, 1000) };
  }

  return { ok: true, remaining: Math.max(limit - entry.count, 0), retryAfterMs: entry.resetAt - now };
}
