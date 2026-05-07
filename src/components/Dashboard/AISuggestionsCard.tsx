/**
 * AISuggestionsCard — the AI showcase on the dashboard
 *
 * Renders 3 contextual suggestions from generateSuggestions(). Each clickable
 * row navigates to /chat with the prompt prefilled in the URL.
 *
 * This is the headline feature: shows the AI is paying attention to the
 * user's actual data (refills due, upcoming appointments, low energy, etc.)
 */

"use client";

import Link from "next/link";
import { UserData } from "@/types";
import { generateSuggestions } from "@/lib/suggestions";

const PRIORITY_BADGE: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-slate-100 text-slate-600",
};

interface AISuggestionsCardProps {
  userData: UserData;
}

export function AISuggestionsCard({ userData }: AISuggestionsCardProps) {
  const suggestions = generateSuggestions(userData);

  return (
    <div className="bg-gradient-to-br from-violet-50 to-white rounded-2xl shadow-md p-6 border border-violet-100">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xl">✨</span>
        <h3 className="text-xl font-bold text-slate-800">For you today</h3>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        AI-powered suggestions based on your data
      </p>

      <div className="space-y-2">
        {suggestions.map((s) => {
          const params = new URLSearchParams({
            prompt: s.prompt,
            ...(s.agent && { agent: s.agent }),
          });
          return (
            <Link
              key={s.id}
              href={`/chat?${params.toString()}`}
              className="group flex items-start gap-3 p-3 rounded-xl bg-white hover:bg-violet-50 border border-slate-100 hover:border-violet-200 transition-all"
            >
              <span className="text-2xl flex-shrink-0">{s.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="font-semibold text-slate-800 group-hover:text-violet-700 transition-colors">
                    {s.title}
                  </p>
                  {s.priority === "high" && (
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_BADGE[s.priority]}`}>
                      Priority
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 line-clamp-2">{s.prompt}</p>
                {s.agent && (
                  <p className="text-xs text-violet-600 mt-1 font-medium">
                    → Ask {s.agent}
                  </p>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
