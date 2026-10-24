const BASE = import.meta.env.VITE_API_URL ?? "";

async function call(path) {
  let res;
  try {
    res = await fetch(BASE + path);
  } catch {
    throw new Error("Cannot reach the server.");
  }
  const body = await res.json().catch(() => null);
  if (!body?.success) {
    throw new Error(body?.error?.message ?? `Request failed (${res.status})`);
  }
  return body.data;
}

export const getHealth = () => call("/health");

export const getAnalysis = ({ deliveryDate, decisionCutoff }) =>
  call(
    "/api/analysis?" +
      new URLSearchParams({
        delivery_date: deliveryDate,
        decision_cutoff: decisionCutoff,
      })
  );