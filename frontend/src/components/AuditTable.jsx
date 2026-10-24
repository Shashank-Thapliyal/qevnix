import { num, signed, stamp, hhmm, settlementPeriod } from "../lib/format";

const th = "sticky top-0 bg-canvas px-3 py-2 text-[11px] font-medium uppercase tracking-widest text-ink border-b border-line";

export default function AuditTable({ points, mae }) {
  return (
    <div className="max-h-[28rem] overflow-auto rounded-sm border border-line">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="text-right">
            <th className={`${th} text-left`}>SP</th>
            <th className={`${th} text-left`}>Settlement time</th>
            <th className={`${th} text-left`}>Publish time</th>
            <th className={th}>Forecast (MW)</th>
            <th className={th}>Actual (MW)</th>
            <th className={th}>Error (MW)</th>
          </tr>
        </thead>
        <tbody className="font-mono text-data">
          {points.map((p) => {
            const big = Math.abs(p.error) > 2 * mae;
            return (
              <tr key={p.startTime} className="odd:bg-canvas even:bg-surface">
                <td className="px-3 py-1.5">{settlementPeriod(p.startTime)}</td>
                <td className="px-3 py-1.5">{hhmm(p.startTime)}</td>
                <td className="px-3 py-1.5 text-muted">{stamp(p.publishTime)}</td>
                <td className="px-3 py-1.5 text-right">{num(p.forecast)}</td>
                <td className="px-3 py-1.5 text-right">{num(p.actual)}</td>
                <td
                  className={`px-3 py-1.5 text-right ${big ? "font-medium text-risk" : ""}`}
                  title={big ? "More than 2× MAE" : undefined}
                >
                  {signed(p.error)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}