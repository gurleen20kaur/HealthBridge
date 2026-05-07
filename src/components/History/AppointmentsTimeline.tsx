/**
 * AppointmentsTimeline — vertical timeline of past + upcoming appointments
 */

"use client";

import { Appointment } from "@/types";

const STATUS_STYLE: Record<string, string> = {
  upcoming: "bg-teal-100 text-teal-700 border-teal-300",
  completed: "bg-slate-100 text-slate-600 border-slate-300",
  cancelled: "bg-red-50 text-red-600 border-red-200 line-through",
};

const DOT_COLOR: Record<string, string> = {
  upcoming: "bg-teal-500",
  completed: "bg-slate-400",
  cancelled: "bg-red-400",
};

interface AppointmentsTimelineProps {
  appointments: Appointment[];
}

export function AppointmentsTimeline({ appointments }: AppointmentsTimelineProps) {
  // Sort: upcoming (nearest first) at top, then completed (most recent first)
  const sorted = [...appointments].sort((a, b) => {
    if (a.status === "upcoming" && b.status !== "upcoming") return -1;
    if (a.status !== "upcoming" && b.status === "upcoming") return 1;
    return a.date.localeCompare(b.date);
  });

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-md p-6">
        <h3 className="text-xl font-bold text-slate-800 mb-4">📅 Appointments</h3>
        <div className="text-center py-12 text-slate-400 text-sm">
          No appointments yet. Add one from the Dashboard.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h3 className="text-xl font-bold text-slate-800 mb-4">
        📅 Appointments timeline
      </h3>

      <div className="relative">
        {/* Vertical line behind the dots */}
        <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-slate-200" />

        <div className="space-y-4">
          {sorted.map((apt) => {
            const date = new Date(apt.date);
            const formatted = date.toLocaleDateString("en-US", {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            });

            return (
              <div key={apt.id} className="relative pl-8">
                {/* Timeline dot */}
                <div
                  className={`absolute left-0 top-2 w-4 h-4 rounded-full border-4 border-white ${DOT_COLOR[apt.status]}`}
                />

                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800">
                      {apt.specialty}
                    </p>
                    <p className="text-sm text-slate-600">
                      {apt.doctorName} · {apt.location}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{formatted}</p>
                    {apt.reason && (
                      <p className="text-sm text-slate-500 italic mt-1">
                        {apt.reason}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full border ${STATUS_STYLE[apt.status]}`}
                  >
                    {apt.status}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
