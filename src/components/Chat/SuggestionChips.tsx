/**
 * SuggestionChips — contextual prompt chips above the chat input
 *
 * Shows 4 contextual prompts based on userData. Clicking a chip prefills
 * the input box (parent owns the input value).
 *
 * Different from the dashboard's AISuggestionsCard: those are full cards
 * for quick navigation. These are inline, compact, and chat-focused.
 */

"use client";

import { UserData } from "@/types";

interface ChatSuggestion {
  label: string;
  prompt: string;
}

function buildChatSuggestions(userData: UserData): ChatSuggestion[] {
  const suggestions: ChatSuggestion[] = [];

  // Next appointment-related
  const nextApt = userData.appointments
    .filter((a) => a.status === "upcoming")
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  if (nextApt) {
    suggestions.push({
      label: `Coverage for ${nextApt.specialty}`,
      prompt: `What does my plan cover for my upcoming ${nextApt.specialty} visit?`,
    });
  }

  // Most recent feeling
  const recent = [...userData.wellnessLog]
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  if (recent?.feelingNote) {
    suggestions.push({
      label: "About today's feeling",
      prompt: `Based on my recent wellness data, what should I do about how I'm feeling?`,
    });
  }

  // Generic but useful
  suggestions.push({
    label: "Find a doctor",
    prompt: "Can you help me find a primary care doctor that fits my needs?",
  });

  // Medication
  if (userData.medications.length > 0) {
    const med = userData.medications[0];
    suggestions.push({
      label: `${med.name} questions`,
      prompt: `Tell me about ${med.name} — what should I watch for and any interactions?`,
    });
  } else {
    suggestions.push({
      label: "Healthy habits",
      prompt: "What are 3 small wellness habits I could adopt this week?",
    });
  }

  return suggestions.slice(0, 4);
}

interface SuggestionChipsProps {
  userData: UserData;
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

export function SuggestionChips({
  userData,
  onSelect,
  disabled = false,
}: SuggestionChipsProps) {
  const chips = buildChatSuggestions(userData);

  return (
    <div className="flex flex-wrap gap-2">
      {chips.map((chip, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(chip.prompt)}
          disabled={disabled}
          className="text-xs px-3 py-1.5 rounded-full bg-violet-50 text-violet-700 hover:bg-violet-100 border border-violet-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ✨ {chip.label}
        </button>
      ))}
    </div>
  );
}
