/**
 * ContextSidebar — shows what context the AI is using
 *
 * Builds trust by being transparent: "✓ Plan loaded · ✓ 7 days of wellness".
 * Helps users understand why the AI's answers are personalized.
 */

"use client";

import { UserData } from "@/types";
import { summarizeContext } from "@/lib/contextBuilder";

interface ContextSidebarProps {
  userData: UserData;
}

export function ContextSidebar({ userData }: ContextSidebarProps) {
  const ctx = summarizeContext(userData);

  return (
    <div className="bg-white rounded-2xl shadow-md p-5 space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-700 mb-1">
          ✨ AI is using:
        </h3>
        <p className="text-xs text-slate-500">
          The agent personalizes answers using this context.
        </p>
      </div>

      <ul className="space-y-2 text-sm">
        <ContextRow
          checked={ctx.hasPlan}
          label="Insurance plan"
          detail={ctx.planFileName ?? "Upload in Wellness tab"}
        />
        <ContextRow
          checked={ctx.wellnessEntryCount > 0}
          label="Wellness history"
          detail={
            ctx.wellnessEntryCount > 0
              ? `${ctx.wellnessEntryCount} entries (last 7 sent)`
              : "No entries yet"
          }
        />
        <ContextRow
          checked={ctx.medicationCount > 0}
          label="Medications"
          detail={
            ctx.medicationCount > 0
              ? `${ctx.medicationCount} active`
              : "None added"
          }
        />
        <ContextRow
          checked={ctx.hasSymptomsToday}
          label="Today's check-in"
          detail={ctx.hasSymptomsToday ? "Logged" : "Not logged yet"}
        />
      </ul>

      <div className="pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-500">
          The 3 agents — HealthGuide, SymptomInsight, CoverageAdvisor — share
          this context. HealthGuide routes your question to the right specialist.
        </p>
      </div>
    </div>
  );
}

function ContextRow({
  checked,
  label,
  detail,
}: {
  checked: boolean;
  label: string;
  detail: string;
}) {
  return (
    <li className="flex items-start gap-2">
      <span
        className={`mt-0.5 w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center text-xs ${
          checked
            ? "bg-green-500 text-white"
            : "bg-slate-200 text-slate-400"
        }`}
      >
        {checked ? "✓" : "·"}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`font-medium ${checked ? "text-slate-800" : "text-slate-500"}`}>
          {label}
        </p>
        <p className="text-xs text-slate-500 truncate">{detail}</p>
      </div>
    </li>
  );
}
