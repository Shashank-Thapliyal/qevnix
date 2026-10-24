import { useEffect, useState } from "react";
import { getHealth } from "../lib/api";
import { MIN_DELIVERY, MAX_DELIVERY } from "../lib/format";

const field =
  "mt-1 block rounded-sm border border-line bg-canvas px-2 py-1.5 font-mono text-sm text-data focus:border-ink focus:outline-none";
const label = "text-[11px] uppercase tracking-widest text-muted";

export default function Header({ deliveryDate, cutoff, onDate, onCutoff }) {
  const [online, setOnline] = useState(null);

  useEffect(() => {
    getHealth().then(() => setOnline(true)).catch(() => setOnline(false));
  }, []);

  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-6 px-6 py-6">
        <div>
          <p className={label}>GB wind · day-ahead desk</p>
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            UK Day-Ahead Wind Forecast Evaluator
          </h1>
        </div>

        <div className="flex flex-wrap items-end gap-4">
          <label>
            <span className={label}>Delivery date</span>
            <input
              type="date"
              className={field}
              value={deliveryDate}
              min={MIN_DELIVERY}
              max={MAX_DELIVERY}
              onChange={(e) => e.target.value && onDate(e.target.value)}
            />
          </label>
          <label>
            <span className={label}>Decision cutoff (UTC)</span>
            <input
              type="datetime-local"
              className={field}
              value={cutoff}
              min="2026-01-01T00:00"
              max="2026-01-31T23:59"
              onChange={(e) => e.target.value && onCutoff(e.target.value)}
            />
          </label>
          <span
            className="mb-2 flex items-center gap-1.5 font-mono text-[11px] tracking-widest text-muted"
            title="GET /health"
          >
            <span
              className={`h-2 w-2 rounded-full ${
                online === null ? "bg-line" : online ? "bg-actual" : "bg-risk"
              }`}
            />
            {online === null ? "CHECKING" : online ? "ONLINE" : "OFFLINE"}
          </span>
        </div>
      </div>
    </header>
  );
}