import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { hhmm, stamp, num, signed } from "../lib/format";

function WarmTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-sm border border-line bg-surface p-3 font-mono text-xs text-data shadow-none">
      <p className="font-medium text-ink">Target {hhmm(p.startTime)} UTC</p>
      <p className="text-muted">Published {stamp(p.publishTime)}</p>
      <p className="mt-2 text-forecast">Forecast {num(p.forecast)} MW</p>
      <p className="text-actual">Actual {num(p.actual)} MW</p>
      <p className="mt-1">Error {signed(p.error)} MW</p>
    </div>
  );
}

export default function ForecastChart({ points }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <LineChart data={points} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid stroke="#e2d9cc" strokeDasharray="2 4" vertical={false} />
          <XAxis
            dataKey="startTime"
            tickFormatter={hhmm}
            interval={5}
            tick={{ fill: "#6b5b52", fontSize: 11, fontFamily: "IBM Plex Mono" }}
            stroke="#e2d9cc"
          />
          <YAxis
            tick={{ fill: "#6b5b52", fontSize: 11, fontFamily: "IBM Plex Mono" }}
            stroke="#e2d9cc"
            tickFormatter={(v) => num(v)}
            width={56}
            label={{ value: "MW", angle: -90, position: "insideLeft", fill: "#6b5b52", fontSize: 11 }}
          />
          <Tooltip content={<WarmTooltip />} cursor={{ stroke: "#6b5b52", strokeDasharray: "2 2" }} />
          <Legend iconType="plainline" wrapperStyle={{ fontSize: 12, color: "#6b5b52" }} />
          <Line name="Forecast" dataKey="forecast" stroke="#c85a32" strokeWidth={2} dot={false} />
          <Line name="Actual" dataKey="actual" stroke="#2d5a27" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}