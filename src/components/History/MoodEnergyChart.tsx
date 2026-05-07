/**
 * MoodEnergyChart — dual-line chart of mood (1-5) and energy (1-10)
 * over the last 30 days.
 */

"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { WellnessEntry } from "@/types";

interface MoodEnergyChartProps {
  entries: WellnessEntry[];
}

function getLast30Days(): string[] {
  const days: string[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

export function MoodEnergyChart({ entries }: MoodEnergyChartProps) {
  // Build a series of {date, mood, energy} for the last 30 days, gaps as null
  const data = getLast30Days().map((date) => {
    const entry = entries.find((e) => e.date === date);
    return {
      date,
      label: new Date(date).toLocaleDateString("en", {
        month: "short",
        day: "numeric",
      }),
      mood: entry?.mood ?? null,
      // Scale energy to 1-5 for shared axis
      energyScaled: entry?.energy != null ? entry.energy / 2 : null,
      energy: entry?.energy ?? null,
    };
  });

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h3 className="text-xl font-bold text-slate-800 mb-1">
        😊 Mood & energy
      </h3>
      <p className="text-sm text-slate-500 mb-4">Last 30 days</p>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#94a3b8" }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 5]}
              ticks={[1, 2, 3, 4, 5]}
              tick={{ fontSize: 11, fill: "#94a3b8" }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
              }}
              formatter={(value, name) => {
                if (name === "Mood") return [`${value}/5`, "Mood"];
                if (name === "Energy")
                  return [`${value}/10`, "Energy"];
                return [value, name];
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Line
              type="monotone"
              dataKey="mood"
              stroke="#14b8a6"
              strokeWidth={2}
              dot={{ r: 4, fill: "#14b8a6" }}
              connectNulls
              name="Mood"
            />
            <Line
              type="monotone"
              dataKey="energyScaled"
              stroke="#fb923c"
              strokeWidth={2}
              dot={{ r: 4, fill: "#fb923c" }}
              connectNulls
              name="Energy"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <p className="text-xs text-slate-400 mt-2 text-center">
        Energy scaled to mood axis · hover for actual values
      </p>
    </div>
  );
}
