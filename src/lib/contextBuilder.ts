/**
 * contextBuilder
 *
 * Converts UserData (the localStorage shape) into the MessageContext shape
 * that POST /api/chat expects (planText, healthData, symptomHistory).
 *
 * This is what makes every AI response personalized — the agents see the
 * user's actual plan, recent wellness trends, and current symptoms.
 */

import { UserData, ChatRequest } from "@/types";

/**
 * Serialize the last N wellness entries into a compact text summary
 * the agent can read.
 */
function formatWellnessLog(data: UserData, days: number): string {
  if (data.wellnessLog.length === 0) {
    return "No wellness entries logged yet.";
  }

  // Sort by date descending and take the most recent N
  const recent = [...data.wellnessLog]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, days);

  const lines = recent.map((e) => {
    const parts = [
      `${e.date}:`,
      `mood ${e.mood}/5`,
      `energy ${e.energy}/10`,
    ];
    if (e.pain !== undefined) parts.push(`pain ${e.pain}/10`);
    if (e.sleepHours !== undefined) parts.push(`slept ${e.sleepHours}h`);
    if (e.exerciseMinutes !== undefined && e.exerciseMinutes > 0) {
      parts.push(`${e.exerciseMinutes}min ${e.exerciseType ?? "exercise"}`);
    }
    if (e.feelingNote) parts.push(`note: "${e.feelingNote}"`);
    return parts.join(", ");
  });

  return `Recent wellness (last ${recent.length} days):\n${lines.join("\n")}`;
}

/**
 * Format active medications as a list
 */
function formatMedications(data: UserData): string {
  if (data.medications.length === 0) return "";
  return (
    "Current medications:\n" +
    data.medications
      .map((m) => `- ${m.name} ${m.dosage}, ${m.frequency}`)
      .join("\n")
  );
}

/**
 * Today's symptom/feeling summary
 */
function formatTodaySymptoms(data: UserData): string {
  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = data.wellnessLog.find((e) => e.date === today);

  if (!todayEntry) return "";

  const parts: string[] = [];
  if (todayEntry.feelingNote) parts.push(`Today: ${todayEntry.feelingNote}`);
  if (todayEntry.pain !== undefined && todayEntry.pain > 0) {
    parts.push(`Pain level: ${todayEntry.pain}/10`);
  }
  if (todayEntry.mood <= 2) {
    parts.push(`Mood is low today (${todayEntry.mood}/5)`);
  }

  return parts.join(". ");
}

/**
 * Build the full ChatRequest body for POST /api/chat
 *
 * @param userMessage - what the user typed (or a prefilled prompt from a chip)
 * @param userData - the full UserData from localStorage
 * @param agent - optional target agent (HealthGuide / SymptomInsight / CoverageAdvisor)
 */
export function buildChatRequest(
  userMessage: string,
  userData: UserData | null,
  agent?: string
): ChatRequest {
  if (!userData) {
    return { message: userMessage, agent };
  }

  // planText combines insurance plan + medications (both are coverage-relevant)
  const planSections: string[] = [];
  if (userData.insurancePlan?.text) planSections.push(userData.insurancePlan.text);
  const meds = formatMedications(userData);
  if (meds) planSections.push(meds);

  return {
    message: userMessage,
    planText: planSections.length > 0 ? planSections.join("\n\n") : undefined,
    healthData: formatWellnessLog(userData, 7),
    symptomHistory: formatTodaySymptoms(userData) || undefined,
    agent,
  };
}

/**
 * Quick check: how much context will be sent?
 * Used by ContextSidebar to show the user what the AI knows.
 */
export interface ContextSummary {
  hasPlan: boolean;
  planFileName?: string;
  wellnessEntryCount: number;
  medicationCount: number;
  hasSymptomsToday: boolean;
}

export function summarizeContext(userData: UserData | null): ContextSummary {
  if (!userData) {
    return {
      hasPlan: false,
      wellnessEntryCount: 0,
      medicationCount: 0,
      hasSymptomsToday: false,
    };
  }

  const today = new Date().toISOString().slice(0, 10);
  return {
    hasPlan: !!userData.insurancePlan,
    planFileName: userData.insurancePlan?.fileName,
    wellnessEntryCount: userData.wellnessLog.length,
    medicationCount: userData.medications.length,
    hasSymptomsToday: userData.wellnessLog.some((e) => e.date === today),
  };
}
