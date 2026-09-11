// ── Evenmore ERP Universal Date Formatter ──────────────────────────────
export function formatDateDDMMYYYY(input) {
  if (!input) return '';
  
  if (input === 'Today' || input === 'today') {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  }

  // If already in DD-MM-YYYY format (e.g. 10-09-2026)
  if (/^\d{2}-\d{2}-\d{4}$/.test(input)) {
    return input;
  }

  // If in YYYY-MM-DD format (e.g. 2026-09-10)
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    const [y, m, d] = input.split('-');
    return `${d}-${m}-${y}`;
  }

  // If string contains natural format like "Sep 10, 2026", "Oct 18, 2026"
  const parsed = new Date(input);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}-${month}-${year}`;
  }

  return String(input);
}

export function getCurrentDateFormatted() {
  const d = new Date();
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}
