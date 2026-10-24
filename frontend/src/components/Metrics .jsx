import { num, signed } from "../lib/format";

function Cell({ title, value, unit, children }) {
  return (
    <div className="p-5">
      <p className="text-[11px] uppercase tracking-widest text-muted">{title}</p>
      <p className="mt-2 font-mono text-3xl font-medium text-data">
        {value}
        {unit && <span className="ml-1 text-sm text-muted">{unit}</span>}
      </p>
      {children && <div className="mt-2 text-xs text-muted">{children}</div>}
    </div>
  );
}

export default function Metrics({ metrics, matched }) {
  const { mae, rmse, bias } = metrics;
  const over = bias > 0;

  return (
    <section className="grid grid-cols-1 divide-y divide-line rounded-sm border border-line bg-surface sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
      <Cell title="MAE" value={num(mae, 1)} unit="MW">
        Typical miss, either direction.
      </Cell>
      <Cell title="RMSE" value={num(rmse, 1)} unit="MW">
        Like MAE, but punishes big misses more.
      </Cell>
      <Cell title="Forecast bias" value={signed(bias, 1)} unit="MW">
        <span className="inline-block rounded-sm border border-risk px-1.5 py-0.5 font-medium text-risk">
          {over ? "SHORT RISK · forecast ran high" : "LONG RISK · forecast ran low"}
        </span>
        <p className="mt-1">
          {over
            ? "Wind was over-estimated, so you may have under-bought."
            : "Wind was under-estimated, so you may have over-bought."}
        </p>
      </Cell>
      <Cell title="Matched intervals" value={`${matched} / 48`}>
        Half-hours with both forecast and actual.
      </Cell>
    </section>
  );
}