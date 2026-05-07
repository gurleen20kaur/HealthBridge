/**
 * /wellness — Daily check-in page
 *
 * - CheckInForm on the left (main content)
 * - PlanSection on the right (insurance plan upload)
 *
 * Both read/write through useUserData (localStorage hook).
 */

"use client";

import { useUserData } from "@/hooks/useUserData";
import { CheckInForm } from "@/components/Wellness/CheckInForm";
import { PlanSection } from "@/components/Wellness/PlanSection";

export default function WellnessPage() {
  const { userData, isLoading, update } = useUserData();

  if (isLoading || !userData) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse text-slate-400">Loading…</div>
      </div>
    );
  }

  // Re-fetch to refresh the form after save
  const handleSaved = () => {
    // useUserData reads from localStorage on mount; we trigger a re-render by
    // calling update with no real change. Or just rely on the form's internal
    // savedFlash state — both work.
    update({});
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-800">🌱 Daily Wellness</h1>
        <p className="text-slate-500 mt-1">
          Log how you're feeling today and the AI personalizes its answers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CheckInForm userData={userData} onSaved={handleSaved} />
        </div>

        <div className="lg:col-span-1">
          <PlanSection userData={userData} onUpdate={update} />
        </div>
      </div>
    </div>
  );
}
