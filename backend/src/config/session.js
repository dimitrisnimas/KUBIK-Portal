function positiveInteger(value, fallback, minimum) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? Math.max(minimum, parsed) : fallback;
}

const SESSION_TTL_SECONDS = positiveInteger(
  process.env.DEMO_SESSION_TTL_SECONDS,
  3 * 60 * 60,
  15 * 60,
);

module.exports = { SESSION_TTL_SECONDS };
