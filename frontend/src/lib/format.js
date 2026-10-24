export const num = (n, d = 0) =>
  n.toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });

export const signed = (n, d = 0) =>
  (n > 0 ? "+" : n < 0 ? "−" : "") + num(Math.abs(n), d);

export const hhmm = (iso) => new Date(iso).toISOString().slice(11, 16);

// "2026-01-14T12:00:00Z" -> "14 Jan 12:00"
export const stamp = (iso) => {
  const d = new Date(iso);
  const day = d.getUTCDate();
  const mon = d.toLocaleString("en-GB", { month: "short", timeZone: "UTC" });
  return `${day} ${mon} ${hhmm(iso)}`;
};

// Settlement period 1 starts 00:00 UK time. In January UK time = UTC.
export const settlementPeriod = (iso) => {
  const d = new Date(iso);
  return d.getUTCHours() * 2 + d.getUTCMinutes() / 30 + 1;
};

// Typical day-ahead decision: noon the day before delivery.
export function defaultCutoff(deliveryDate) {
  const d = new Date(`${deliveryDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 16); // format datetime-local expects
}

// Allowed delivery dates so the cutoff (D-1) stays in January 2026.
export const MIN_DELIVERY = "2026-01-02";
export const MAX_DELIVERY = "2026-02-01";