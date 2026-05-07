/**
 * /dashboard — Main overview page
 *
 * Layout: 2-column grid on desktop, stacked on mobile
 *  ┌──────────────────────┐
 *  │ WelcomeCard (full width)
 *  ├─────────┬────────────┤
 *  │ Snapshot│ Suggestions│
 *  ├─────────┴────────────┤
 *  │ Appointments (full)  │
 *  └──────────────────────┘
 */

"use client";

import { useUserData } from "@/hooks/useUserData";
import { WelcomeCard } from "@/components/Dashboard/WelcomeCard";
import { AppointmentsCard } from "@/components/Dashboard/AppointmentsCard";
import { AISuggestionsCard } from "@/components/Dashboard/AISuggestionsCard";
import { WellnessSnapshotCard } from "@/components/Dashboard/WellnessSnapshotCard";
import { Appointment } from "@/types";

export default function DashboardPage() {
  const { userData, isLoading, update, reset } = useUserData();

  if (isLoading || !userData) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse text-slate-400">Loading…</div>
      </div>
    );
  }

  const handleAddAppointment = (apt: Appointment) => {
    update({ appointments: [...userData.appointments, apt] });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      {/* Demo data badge */}
      {userData.isSeedData && (
        <div className="bg-amber-100 border border-amber-200 rounded-xl px-4 py-2 flex items-center justify-between">
          <p className="text-sm text-amber-900">
            👋 You're seeing demo data so the dashboard isn't empty. Log a real
            check-in to start your own history.
          </p>
          <button
            onClick={() => {
              if (confirm("Clear demo data and start fresh?")) reset();
            }}
            className="text-xs font-medium text-amber-800 hover:text-amber-900 underline"
          >
            Reset
          </button>
        </div>
      )}

      <WelcomeCard userData={userData} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WellnessSnapshotCard userData={userData} />
        <AISuggestionsCard userData={userData} />
      </div>

      <AppointmentsCard userData={userData} onAdd={handleAddAppointment} />
    </div>
  );
}
