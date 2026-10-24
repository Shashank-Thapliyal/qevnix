import { useState } from "react";
import Header from "./components/Header";
import Metrics  from "./components/Metrics ";
import ForecastChart from "./components/ForecastChart";
import AuditTable from "./components/AuditTable";
import { useAnalysis } from "./hooks/useAnalysis";
import { defaultCutoff, stamp } from "./lib/format";

function Section({ title, note, children }) {
  return (
    <section className="border-t border-line py-8">
      <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
      {note && <p className="mb-4 mt-1 max-w-2xl text-sm text-muted">{note}</p>}
      {children}
    </section>
  );
}

export default function App() {
  const [date, setDate] = useState("2026-01-15");
  const [cutoff, setCutoff] = useState(defaultCutoff("2026-01-15"));
  const { data, loading, error } = useAnalysis(date, cutoff);

  const changeDate = (d) => {
    setDate(d);
    setCutoff(defaultCutoff(d)); // keep cutoff = D-1 12:00 unless user edits it
  };

  const publishTimes = data?.points.map((p) => new Date(p.publishTime).getTime()) ?? [];
  const oldest = publishTimes.length ? new Date(Math.min(...publishTimes)).toISOString() : null;
  const newest = publishTimes.length ? new Date(Math.max(...publishTimes)).toISOString() : null;

  return (
    <>
      <Header deliveryDate={date} cutoff={cutoff} onDate={changeDate} onCutoff={setCutoff} />

      <main className={`mx-auto max-w-6xl px-6 py-8 transition-opacity ${loading ? "opacity-50" : ""}`}>
        {error && (
          <p className="rounded-sm border border-risk p-4 text-sm text-risk">{error}</p>
        )}

        {data && data.matchedIntervals === 0 && (
          <p className="text-sm text-muted">{data.message}</p>
        )}

        {data && data.matchedIntervals > 0 && (
          <>
            <p className="mb-6 max-w-3xl text-sm text-muted">
              For delivery on <span className="font-mono text-data">{data.deliveryDate}</span>, the
              latest forecast available before the cutoff of{" "}
              <span className="font-mono text-data">{stamp(data.decisionCutoff)}</span> UTC was
              published between <span className="font-mono text-data">{stamp(oldest)}</span> and{" "}
              <span className="font-mono text-data">{stamp(newest)}</span>.
            </p>

            <Metrics metrics={data.metrics} matched={data.matchedIntervals} />

            <div className="mt-8">
              <Section
                title="Forecast against actual"
                note="What the desk would have seen at the cutoff, versus what the wind actually delivered."
              >
                <ForecastChart points={data.points} />
              </Section>

              <Section
                title="Settlement period audit"
                note="Every half-hour, with the forecast version used. Amber errors exceed twice the MAE."
              >
                <AuditTable points={data.points} mae={data.metrics.mae} />
              </Section>
            </div>
          </>
        )}

        {loading && !data && <p className="text-sm text-muted">Loading forecast data…</p>}
      </main>
    </>
  );
}