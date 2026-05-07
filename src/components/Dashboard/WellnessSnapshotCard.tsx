/**
 * WellnessSnapshotCard — week-at-a-glance for mood and energy
 *
 * Hand-rolled inline SVG sparkline (no chart library dependency yet).
 * Shows last 7 days of mood as colored circles with a connecting line.
 */

"use client";

import Link from "next/link";
import { UserData } from "@/types";

const MOOD_COLOR = ["", "#ef4444", "#f97316", "#eab308", "#84cc16", "#10b981"];

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

interface WellnessSnapshotCardProps {
  userData: UserData;
}

export function WellnessSnapshotCard({ userData }: WellnessSnapshotCardProps) {
  const days = getLast7Days();
  const entries = days.map((date) => {
    const entry = userData.wellnessLog.find((e) => e.date === date);
    return { date, mood: entry?.mood ?? null, energy: entry?.energy ?? null };
  });

  // SVG plot dimensions
  const width = 280;
  const height = 80;
  const padX = 12;
  const padY = 8;
  const stepX = (width - padX * 2) / 6; // 6 gaps between 7 points

  // Build mood line points (skip nulls)
  const points: Array<{ x: number; y: number; mood: number }> = [];
  entries.forEach((e, i) => {
    if (e.mood !== null) {
      const x = padX + i * stepX;
      // mood 1..5 → y = height-padY (bottom) to padY (top)
      const y = height - padY - ((e.mood - 1) / 4) * (height - padY * 2);
      points.push({ x, y, mood: e.mood });
    }
  });

  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // Stats
  const moodEntries = entries.filter((e) => e.mood !== null);
  const avgMood =
    moodEntries.length > 0
      ? (
          moodEntries.reduce((sum, e) => sum + (e.mood ?? 0), 0) /
          moodEntries.length
        ).toFixed(1)
      : "—";
  const avgEnergy =
    moodEntries.length > 0
      ? (
          entries
            .filter((e) => e.energy !== null)
            .reduce((sum, e) => sum + (e.energy ?? 0), 0) /
            entries.filter((e) => e.energy !== null).length || 0
        ).toFixed(1)
      : "—";

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-slate-800">📈 This week</h3>
        <Link
          href="/history"
          className="text-sm text-teal-600 hover:text-teal-700 font-medium"
        >
          See history →
        </Link>
      </div>

      {moodEntries.length === 0 ? (
        <div className="text-center py-8 text-slate-400 text-sm">
          Log a few days to see your trend
        </div>
      ) : (
        <>
          {/* Sparkline */}
          <div className="my-4">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-20"
              preserveAspectRatio="none"
            >
              {/* connecting line */}
              {points.length > 1 && (
                <path
                  d={linePath}
                  stroke="#14b8a6"
                  strokeWidth="2"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}
              {/* dots */}
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r="5"
                  fill={MOOD_COLOR[p.mood]}
                  stroke="white"
                  strokeWidth="2"
                />
              ))}
              {/* missing-day markers */}
              {entries.map((e, i) => {
                if (e.mood !== null) return null;
                const x = padX + i * stepX;
                return (
                  <circle
                    key={`missing-${i}`}
                    cx={x}
                    cy={height / 2}
                    r="3"
                    fill="#e5e7eb"
                  />
                );
              })}
            </svg>
          </div>

          {/* Day labels */}
          <div className="flex justify-between text-xs text-slate-400 px-3 mb-4">
            {entries.map((e) => {
              const d = new Date(e.date);
              const isToday =
                e.date === new Date().toISOString().slice(0, 10);
              return (
                <span
                  key={e.date}
                  className={isToday ? "font-bold text-slate-700" : ""}
                >
                  {d.toLocaleDateString("en", { weekday: "narrow" })}
                </span>
              );
            })}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div>
              <div className="text-xs text-slate-500">Avg mood</div>
              <div className="text-2xl font-bold text-slate-800 tabular-nums">
                {avgMood}
                <span className="text-sm text-slate-400">/5</span>
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Avg energy</div>
              <div className="text-2xl font-bold text-slate-800 tabular-nums">
                {avgEnergy}
                <span className="text-sm text-slate-400">/10</span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
