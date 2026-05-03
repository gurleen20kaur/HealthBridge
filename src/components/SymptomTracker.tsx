/**
 * SymptomTracker Component
 *
 * Simple form for users to log symptoms:
 * - Text area to type symptoms
 * - Save button
 * - Shows saved indicator
 * - Stores in parent state (symptomHistory)
 *
 * Usage:
 *   <SymptomTracker
 *     symptomHistory={symptoms}
 *     onSymptomsSaved={(text) => setSymptoms(text)}
 *   />
 */

"use client";

import { useState, useEffect } from "react";

interface SymptomTrackerProps {
  symptomHistory?: string;
  onSymptomsSaved: (text: string) => void;
}

export function SymptomTracker({ symptomHistory, onSymptomsSaved }: SymptomTrackerProps) {
  const [inputValue, setInputValue] = useState(symptomHistory || "");
  const [isSaved, setIsSaved] = useState(!!symptomHistory);
  const [isChanged, setIsChanged] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    setIsChanged(e.target.value !== symptomHistory);
    setIsSaved(false);
  };

  const handleSave = () => {
    if (inputValue.trim()) {
      onSymptomsSaved(inputValue);
      setIsSaved(true);
      setIsChanged(false);
    }
  };

  const handleClear = () => {
    setInputValue("");
    onSymptomsSaved("");
    setIsSaved(false);
    setIsChanged(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
        📝 Symptom History
      </h3>

      <div className="space-y-3">
        {/* Text area for symptoms */}
        <textarea
          value={inputValue}
          onChange={handleChange}
          placeholder="Example: Headaches 2x/week, fatigue for 3 weeks, no fever..."
          className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={4}
        />

        {/* Saved indicator */}
        {isSaved && !isChanged && (
          <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-3">
            <p className="text-sm text-green-800 dark:text-green-100">
              ✓ Symptoms saved ({inputValue.length} characters)
            </p>
          </div>
        )}

        {/* Changed indicator */}
        {isChanged && (
          <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
            <p className="text-sm text-yellow-800 dark:text-yellow-100">
              ⚠ Changes not saved
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleSave}
            disabled={!inputValue.trim() || !isChanged}
            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-2 rounded-lg transition-colors"
          >
            Save Symptoms
          </button>
          <button
            onClick={handleClear}
            disabled={!inputValue.trim()}
            className="flex-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-700 disabled:bg-gray-200 dark:disabled:bg-gray-700 text-gray-800 dark:text-gray-100 font-semibold py-2 rounded-lg transition-colors"
          >
            Clear
          </button>
        </div>

        {/* Help text */}
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Share your symptoms to get personalized health insights
        </p>
      </div>
    </div>
  );
}
