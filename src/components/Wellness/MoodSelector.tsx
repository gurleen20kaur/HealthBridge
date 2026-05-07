/**
 * MoodSelector — 5 emoji buttons for mood (1-5)
 */

"use client";

const MOOD_OPTIONS = [
  { value: 1, emoji: "😢", label: "Bad" },
  { value: 2, emoji: "😕", label: "Low" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😄", label: "Great" },
];

interface MoodSelectorProps {
  value: number;
  onChange: (mood: number) => void;
}

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <div className="flex justify-between gap-2">
      {MOOD_OPTIONS.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`
              flex-1 flex flex-col items-center gap-1 py-3 rounded-xl border-2 transition-all
              ${
                isSelected
                  ? "border-teal-500 bg-teal-50 scale-105 shadow-md"
                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }
            `}
          >
            <span className="text-3xl">{option.emoji}</span>
            <span
              className={`text-xs font-medium ${
                isSelected ? "text-teal-700" : "text-slate-500"
              }`}
            >
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
