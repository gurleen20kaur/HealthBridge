/**
 * SymptomFrequencyChart — bar chart of symptom keyword frequency
 *
 * Extracts symptom keywords from feelingNote text in the last 30 entries
 * and shows how often each appeared.
 */

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { WellnessEntry } from "@/types";

const SYMPTOM_KEYWORDS = [
  "headache",
  "tired",
  "fatigue",
  "stressed",
  "anxious",
  "sore",
  "pain",
  "nausea",
  "dizzy",
  "bloated",
  "cramps",
  "cough",
  "congestion",
];

interface SymptomFrequencyChartProps {
  entries: WellnessEntry[];
}

export function SymptomFrequencyChart({ entries }: SymptomFrequencyChartProps) {
  // Count keyword occurrences across all feeling notes
  const counts = new Map<string, number>();
  for (const entry of entries) {
    if (!entry.feelingNote) continue;
    const note = entry.feelingNote.toLowerCase();
    for (const keyword of SYMPTOM_KEYWORDS) {
      if (note.includes(keyword)) {
        counts.set(keyword, (counts.get(keyword) ?? 0) + 1);
      }
    }
  }

  // Also count days with pain > 3
  const painDays = entries.filter((e) => (e.pain ?? 0) >= 4).length;
  if (painDays > 0) counts.set("pain (logged)", painDays);

  const data = Array.from(counts.entries())
    .map(([symptom, count]) => ({ symptom, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-1">
          🤒 Symptom patterns
        </h3>
        <p className="text-sm text-slate-500 mb-4">
          Frequency in your wellness notes
        </p>
        <div className="text-center py-12 text-slate-400 text-sm">
          No symptoms logged yet — keep journaling to see patterns appear here.
        </div>
      </div>
    );
  }

  // Color: hot (red) for top, cool (teal) for less
  const colorFor = (i: number) => {
    if (i === 0) return "#ef4444";
    if (i <= 2) return "#f97316";
    return "#14b8a6";
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h3 className="text-xl font-bold text-slate-800 mb-1">
        🤒 Symptom patterns
      </h3>
      <p className="text-sm text-slate-500 mb-4">
        How often each symptom shows up in your notes
      </p>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 20, left: 20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} allowDecimals={false} />
            <YAxis
              type="category"
              dataKey="symptom"
              tick={{ fontSize: 11, fill: "#475569" }}
              width={90}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "12px",
              }}
              formatter={(value: number) => [`${value} day${value === 1 ? "" : "s"}`, "Days"]}
            />
            <Bar dataKey="count" radius={[0, 8, 8, 0]}>
              {data.map((_, i) => (
                <Cell key={i} fill={colorFor(i)} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
