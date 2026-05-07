/**
 * AppointmentsCard — next 3 upcoming appointments
 *
 * "+ Add" button opens AddAppointmentModal.
 */

"use client";

import { useState } from "react";
import { UserData, Appointment } from "@/types";
import { AddAppointmentModal } from "./AddAppointmentModal";

const SPECIALTY_EMOJI: Record<string, string> = {
  "Primary Care": "🩺",
  Cardiologist: "❤️",
  Dermatologist: "🧴",
  Dentist: "🦷",
  Optometrist: "👁️",
  Therapist: "💭",
  Psychiatrist: "💭",
  "OB-GYN": "🌸",
  Orthopedist: "🦴",
};

function emojiForSpecialty(s: string): string {
  return SPECIALTY_EMOJI[s] ?? "📋";
}

function formatDate(iso: string): { rel: string; full: string } {
  const date = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  const days = Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  let rel = "";
  if (days === 0) rel = "Today";
  else if (days === 1) rel = "Tomorrow";
  else if (days < 7) rel = `In ${days} days`;
  else if (days < 14) rel = "Next week";
  else if (days < 30) rel = `In ${Math.round(days / 7)} weeks`;
  else rel = `In ${Math.round(days / 30)} months`;

  const full = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  return { rel, full };
}

interface AppointmentsCardProps {
  userData: UserData;
  onAdd: (apt: Appointment) => void;
}

export function AppointmentsCard({ userData, onAdd }: AppointmentsCardProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const upcoming = userData.appointments
    .filter((a) => a.status === "upcoming")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-slate-800">📅 Upcoming</h3>
        <button
          onClick={() => setModalOpen(true)}
          className="text-sm text-teal-600 hover:text-teal-700 font-medium"
        >
          + Add
        </button>
      </div>

      {upcoming.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <p className="text-sm">No upcoming appointments.</p>
          <button
            onClick={() => setModalOpen(true)}
            className="text-sm text-teal-600 hover:text-teal-700 font-medium mt-2"
          >
            Add your first one
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {upcoming.map((apt) => {
            const { rel, full } = formatDate(apt.date);
            return (
              <div
                key={apt.id}
                className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
              >
                <span className="text-2xl">{emojiForSpecialty(apt.specialty)}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold text-slate-800 truncate">
                      {apt.specialty}
                    </p>
                    <span className="text-xs font-medium text-teal-700 bg-teal-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                      {rel}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 truncate">
                    {apt.doctorName}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {full} · {apt.reason}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddAppointmentModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onAdd={onAdd}
      />
    </div>
  );
}
