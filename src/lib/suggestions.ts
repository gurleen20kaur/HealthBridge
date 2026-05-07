/**
 * Suggestion generator
 *
 * Pure function over UserData → returns up to 3 contextual suggestion chips
 * to render on the dashboard. Each suggestion has a prefilled prompt that
 * gets sent to the AI when clicked (via /chat?prompt=...).
 *
 * Rules (priority order):
 * 1. Medication refill due in <7 days → high priority
 * 2. Upcoming appointment within 7 days → suggest coverage check
 * 3. Low energy or low mood for 3+ days → suggest chat
 * 4. Frequent symptom in feelingNote → suggest specialist lookup
 * 5. No wellness entry today → gentle nudge
 *
 * If fewer than 3 rules fire, fill in with general-purpose prompts.
 */

import { UserData, Suggestion } from "@/types";

const DEFAULT_SUGGESTIONS: Suggestion[] = [
  {
    id: "default-1",
    icon: "🩺",
    title: "Find a doctor",
    prompt: "Help me find a primary care doctor near me",
    agent: "HealthGuide",
    priority: "low",
  },
  {
    id: "default-2",
    icon: "💊",
    title: "Coverage check",
    prompt: "What does my insurance plan cover for routine checkups?",
    agent: "CoverageAdvisor",
    priority: "low",
  },
  {
    id: "default-3",
    icon: "🥗",
    title: "Healthy meals",
    prompt: "Suggest some healthy meal ideas for this week",
    agent: "HealthGuide",
    priority: "low",
  },
];

// Days from now → ISO date string YYYY-MM-DD
function daysBetween(date: string): number {
  const target = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round(
    (target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );
}

export function generateSuggestions(data: UserData): Suggestion[] {
  const suggestions: Suggestion[] = [];

  // Rule 1: Medication refill needed soon
  for (const med of data.medications) {
    if (med.refillDate) {
      const days = daysBetween(med.refillDate);
      if (days >= 0 && days <= 7) {
        suggestions.push({
          id: `refill-${med.id}`,
          icon: "💊",
          title: `Refill ${med.name} soon`,
          prompt: `My ${med.name} ${med.dosage} prescription needs a refill in ${days} day${days === 1 ? "" : "s"}. Does my insurance cover refills, and what should I do?`,
          agent: "CoverageAdvisor",
          priority: "high",
        });
      }
    }
  }

  // Rule 2: Upcoming appointment → coverage check
  const upcomingApt = data.appointments
    .filter((a) => a.status === "upcoming")
    .map((a) => ({ apt: a, days: daysBetween(a.date.slice(0, 10)) }))
    .filter(({ days }) => days >= 0 && days <= 7)
    .sort((a, b) => a.days - b.days)[0];

  if (upcomingApt) {
    suggestions.push({
      id: `coverage-${upcomingApt.apt.id}`,
      icon: "📋",
      title: `Check coverage for ${upcomingApt.apt.specialty}`,
      prompt: `I have a ${upcomingApt.apt.specialty} appointment with ${upcomingApt.apt.doctorName} in ${upcomingApt.days} day${upcomingApt.days === 1 ? "" : "s"} for "${upcomingApt.apt.reason}". What does my insurance cover for this visit?`,
      agent: "CoverageAdvisor",
      priority: "high",
    });
  }

  // Rule 3: Low energy/mood pattern (3+ days in last 5)
  const recentEntries = [...data.wellnessLog]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);
  const lowEnergyDays = recentEntries.filter((e) => e.energy <= 4).length;
  const lowMoodDays = recentEntries.filter((e) => e.mood <= 2).length;

  if (lowEnergyDays >= 3) {
    suggestions.push({
      id: "low-energy-pattern",
      icon: "🔋",
      title: "Energy has been low",
      prompt: `My energy has been low (${lowEnergyDays} of the last 5 days at 4 or below). What could be going on, and what should I do about it?`,
      agent: "SymptomInsight",
      priority: "high",
    });
  } else if (lowMoodDays >= 3) {
    suggestions.push({
      id: "low-mood-pattern",
      icon: "💙",
      title: "Mood has been down",
      prompt:
        "My mood has been low for several days. What are some things that could help, and when should I consider talking to someone?",
      agent: "HealthGuide",
      priority: "high",
    });
  }

  // Rule 4: Today's symptoms note mentions something specific
  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = data.wellnessLog.find((e) => e.date === today);
  if (todayEntry?.feelingNote) {
    const note = todayEntry.feelingNote.toLowerCase();
    if (note.includes("headache")) {
      suggestions.push({
        id: "symptom-headache",
        icon: "🤕",
        title: "About your headache",
        prompt: `I have a headache today. Based on my recent wellness data, is there a pattern I should be aware of?`,
        agent: "SymptomInsight",
        priority: "medium",
      });
    } else if (
      note.includes("tired") ||
      note.includes("fatigue") ||
      note.includes("exhausted")
    ) {
      suggestions.push({
        id: "symptom-fatigue",
        icon: "😴",
        title: "About feeling tired",
        prompt:
          "I'm feeling tired today. What could be contributing based on my recent sleep and activity?",
        agent: "SymptomInsight",
        priority: "medium",
      });
    }
  }

  // Rule 5: Haven't checked in today
  if (!todayEntry) {
    suggestions.push({
      id: "nudge-checkin",
      icon: "🌱",
      title: "Log today's check-in",
      prompt: "Help me reflect on how I'm feeling today",
      agent: "HealthGuide",
      priority: "medium",
    });
  }

  // Sort by priority and take top 3, then pad with defaults if needed
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  suggestions.sort(
    (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
  );

  const top = suggestions.slice(0, 3);
  while (top.length < 3) {
    const fallback = DEFAULT_SUGGESTIONS[top.length];
    if (!top.some((s) => s.id === fallback.id)) top.push(fallback);
  }

  return top;
}
