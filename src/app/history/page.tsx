/**
 * /history — Wellness trends and appointment timeline
 *
 * Shows mood/energy chart, symptom frequency, and appointments timeline.
 * Empty state if user has logged fewer than 3 wellness entries.
 */

"use client";

import Link from "next/link";
import { useUserData } from "@/hooks/useUserData";
import { MoodEnergyChart } from "@/components/History/MoodEnergyChart";
import { SymptomFrequencyChart } from "@/components/History/SymptomFrequencyChart";
import { AppointmentsTimeline } from "@/components/History/AppointmentsTimeline";

export default function HistoryPage() {
  const { userData, isLoading } = useUserData();

  if (isLoading || !userData) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse text-slate-400">Loading…</div>
      </div>
    );
  }

  const hasEnoughData = userData.wellnessLog.length >= 3;

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">📊 Your history</h1>
        <p className="text-slate-500 mt-1">
          Trends, patterns, and past appointments at a glance.
        </p>
      </div>

      {!hasEnoughData ? (
        <div className="bg-white rounded-2xl shadow-md p-12 text-center">
          <p className="text-4xl mb-3">🌱</p>
          <h2 className="text-xl font-bold text-slate-800 mb-2">
            Log a few days to see your trends
          </h2>
          <p className="text-slate-500 mb-6">
            Once you have 3+ wellness entries, charts will appear here.
          </p>
          <Link
            href="/wellness"
            className="inline-block bg-teal-500 hover:bg-teal-600 text-white font-semibold px-6 py-3 rounded-xl transition-colors"
          >
            Log a check-in
          </Link>
        </div>
      ) : (
        <>
          <MoodEnergyChart entries={userData.wellnessLog} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SymptomFrequencyChart entries={userData.wellnessLog} />
            <AppointmentsTimeline appointments={userData.appointments} />
          </div>
        </>
      )}
    </div>
  );
}
