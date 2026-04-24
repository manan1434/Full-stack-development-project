// Parse a "YYYY-MM" string into [startDate, endDate) UTC bounds.
function monthRange(yyyymm) {
  if (!/^\d{4}-\d{2}$/.test(yyyymm)) {
    const err = new Error('month must be in YYYY-MM format');
    err.status = 400;
    throw err;
  }
  const [y, m] = yyyymm.split('-').map(Number);
  if (m < 1 || m > 12) {
    const err = new Error('month must be between 01 and 12');
    err.status = 400;
    throw err;
  }
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  return { start, end };
}

function currentMonthString(now = new Date()) {
  const y = now.getUTCFullYear();
  const m = String(now.getUTCMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

module.exports = { monthRange, currentMonthString };
