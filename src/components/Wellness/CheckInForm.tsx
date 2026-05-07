/**
 * CheckInForm — daily wellness check-in with progressive disclosure
 *
 * Always visible: mood, energy, "how are you feeling?"
 * "Add more details" expands: pain, sleep, exercise, medications, diet
 *
 * On save: writes to userData.wellnessLog keyed by today's YYYY-MM-DD.
 * If today is already logged, pre-fills and shows "Update".
 */

"use client";

import { useState, useEffect } from "react";
import { WellnessEntry, UserData } from "@/types";
import { upsertTodayWellnessEntry } from "@/lib/storage";
import { MoodSelector } from "./MoodSelector";
import { EnergySlider } from "./EnergySlider";

interface CheckInFormProps {
  userData: UserData;
  onSaved: () => void; // called after successful save (parent re-fetches)
}

function getToday(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CheckInForm({ userData, onSaved }: CheckInFormProps) {
  const today = getToday();
  const existing = userData.wellnessLog.find((e) => e.date === today);

  // Form state — pre-filled from existing entry if any
  const [mood, setMood] = useState(existing?.mood ?? 3);
  const [energy, setEnergy] = useState(existing?.energy ?? 5);
  const [feelingNote, setFeelingNote] = useState(existing?.feelingNote ?? "");
  const [pain, setPain] = useState(existing?.pain ?? 0);
  const [sleepHours, setSleepHours] = useState(existing?.sleepHours ?? 7);
  const [sleepQuality, setSleepQuality] = useState(existing?.sleepQuality ?? 3);
  const [exerciseMinutes, setExerciseMinutes] = useState(
    existing?.exerciseMinutes ?? 0
  );
  const [exerciseType, setExerciseType] = useState(existing?.exerciseType ?? "");
  const [medsTaken, setMedsTaken] = useState<string[]>(
    existing?.medicationsTaken ?? []
  );
  const [dietNotes, setDietNotes] = useState(existing?.dietNotes ?? "");

  // UI state
  const [showDetails, setShowDetails] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  // If userData updates (e.g., after first save), re-sync the form
  useEffect(() => {
    if (existing && !savedFlash) {
      setShowDetails(
        existing.pain !== undefined ||
          existing.sleepHours !== undefined ||
          existing.exerciseMinutes !== undefined ||
          (existing.medicationsTaken?.length ?? 0) > 0 ||
          !!existing.dietNotes
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existing?.date]);

  const toggleMed = (id: string) => {
    setMedsTaken((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);

    const entry: Omit<WellnessEntry, "createdAt" | "updatedAt"> = {
      date: today,
      mood,
      energy,
      feelingNote,
      // Only include detail fields if "show details" is open OR they have values
      ...(showDetails && {
        pain,
        sleepHours,
        sleepQuality,
        exerciseMinutes,
        exerciseType: exerciseType || undefined,
        medicationsTaken: medsTaken,
        dietNotes: dietNotes || undefined,
      }),
    };

    upsertTodayWellnessEntry(entry);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2500);
    setIsSaving(false);
    onSaved();
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">
          {existing ? "Today's check-in" : "How are you today?"}
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          {existing
            ? "You've logged today. Update anything below."
            : "A quick pulse on your day. Takes under a minute."}
        </p>
      </div>

      {/* MOOD */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-700">Mood</label>
        <MoodSelector value={mood} onChange={setMood} />
      </div>

      {/* ENERGY */}
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-slate-700">
          Energy level
        </label>
        <EnergySlider value={energy} onChange={setEnergy} color="orange" />
      </div>

      {/* FEELING NOTE */}
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-slate-700">
          How are you feeling today?
        </label>
        <textarea
          value={feelingNote}
          onChange={(e) => setFeelingNote(e.target.value)}
          placeholder="Anything on your mind? Symptoms, mood, what kind of day..."
          rows={3}
          className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
        />
      </div>

      {/* TOGGLE DETAILS */}
      <button
        type="button"
        onClick={() => setShowDetails((s) => !s)}
        className="w-full text-left text-sm font-medium text-teal-700 hover:text-teal-800 transition-colors flex items-center justify-between p-3 bg-teal-50 rounded-xl"
      >
        <span>
          {showDetails ? "− Hide details" : "+ Add more details"}
        </span>
        <span className="text-xs text-teal-600">
          {showDetails ? "" : "pain, sleep, exercise, meds, diet"}
        </span>
      </button>

      {/* DETAILS (PROGRESSIVE DISCLOSURE) */}
      {showDetails && (
        <div className="space-y-6 pt-2">
          {/* PAIN */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-slate-700">
              Pain level (if any)
            </label>
            <EnergySlider
              value={pain}
              onChange={setPain}
              min={0}
              max={10}
              color="red"
              lowLabel="None"
              highLabel="Severe"
            />
          </div>

          {/* SLEEP */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Sleep hours
              </label>
              <input
                type="number"
                step="0.5"
                min={0}
                max={24}
                value={sleepHours}
                onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Sleep quality
              </label>
              <EnergySlider
                value={sleepQuality}
                onChange={setSleepQuality}
                min={1}
                max={5}
                color="blue"
                lowLabel="Poor"
                highLabel="Great"
              />
            </div>
          </div>

          {/* EXERCISE */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Exercise (minutes)
              </label>
              <input
                type="number"
                min={0}
                value={exerciseMinutes}
                onChange={(e) => setExerciseMinutes(parseInt(e.target.value, 10) || 0)}
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">
                Type
              </label>
              <input
                type="text"
                value={exerciseType}
                onChange={(e) => setExerciseType(e.target.value)}
                placeholder="Walking, yoga, gym..."
                className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* MEDICATIONS */}
          {userData.medications.length > 0 && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">
                Medications taken today
              </label>
              <div className="flex flex-wrap gap-2">
                {userData.medications.map((med) => {
                  const isTaken = medsTaken.includes(med.id);
                  return (
                    <button
                      key={med.id}
                      type="button"
                      onClick={() => toggleMed(med.id)}
                      className={`
                        px-3 py-2 rounded-full text-sm font-medium border-2 transition-all
                        ${
                          isTaken
                            ? "bg-teal-500 text-white border-teal-500"
                            : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                        }
                      `}
                    >
                      {isTaken ? "✓ " : ""}
                      💊 {med.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* DIET */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">
              Diet notes
            </label>
            <textarea
              value={dietNotes}
              onChange={(e) => setDietNotes(e.target.value)}
              placeholder="What you ate, anything notable..."
              rows={2}
              className="w-full p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
            />
          </div>
        </div>
      )}

      {/* SAVE BUTTON */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm hover:shadow-md"
        >
          {isSaving ? "Saving..." : existing ? "Update entry" : "Save check-in"}
        </button>

        {savedFlash && (
          <div className="text-sm font-medium text-green-700 bg-green-50 px-4 py-2 rounded-xl">
            ✓ Saved!
          </div>
        )}
      </div>
    </div>
  );
}
