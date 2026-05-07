/**
 * WelcomeCard — top of dashboard
 *
 * Shows greeting based on time of day, today's wellness summary if logged,
 * or a CTA to log if not.
 */

"use client";

import Link from "next/link";
import { UserData } from "@/types";

const MOOD_EMOJI = ["", "😢", "😕", "😐", "🙂", "😄"];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

interface WelcomeCardProps {
  userData: UserData;
}

export function WelcomeCard({ userData }: WelcomeCardProps) {
  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = userData.wellnessLog.find((e) => e.date === today);

  return (
    <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-2xl shadow-md p-6 text-white">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-2xl font-bold">
            {getGreeting()}, {userData.profile.name} 👋
          </h2>

          {todayEntry ? (
            <div className="mt-3 space-y-2">
              <p className="text-teal-100">Today's check-in:</p>
              <div className="flex items-center gap-4">
                <span className="text-4xl">{MOOD_EMOJI[todayEntry.mood]}</span>
                <div>
                  <div className="text-sm text-teal-100">Energy</div>
                  <div className="font-mono text-lg font-semibold">
                    {todayEntry.energy}<span className="text-teal-200 text-sm">/10</span>
                  </div>
                </div>
                {todayEntry.pain !== undefined && todayEntry.pain > 0 && (
                  <div>
                    <div className="text-sm text-teal-100">Pain</div>
                    <div className="font-mono text-lg font-semibold">
                      {todayEntry.pain}<span className="text-teal-200 text-sm">/10</span>
                    </div>
                  </div>
                )}
              </div>
              {todayEntry.feelingNote && (
                <p className="text-sm text-teal-50 italic mt-2">
                  &ldquo;{todayEntry.feelingNote}&rdquo;
                </p>
              )}
            </div>
          ) : (
            <p className="mt-2 text-teal-100">
              How are you feeling today? Take a minute to log your check-in.
            </p>
          )}
        </div>

        <Link
          href="/wellness"
          className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white text-sm font-medium px-4 py-2 rounded-full transition-colors whitespace-nowrap"
        >
          {todayEntry ? "Update" : "Check in →"}
        </Link>
      </div>
    </div>
  );
}
