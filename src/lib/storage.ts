/**
 * localStorage helpers for UserData
 *
 * Single key: "healthbridge:userdata" stores everything as JSON.
 * On first read with no data, seeds with demo data so the dashboard isn't empty.
 *
 * SAFETY: All functions are no-ops when run server-side (window === undefined).
 * This matters because Next.js server-renders pages — components that read from
 * localStorage must do so inside useEffect, but our functions guard internally too.
 */

import { UserData } from "@/types";
import { getSeedData } from "./seedData";

const STORAGE_KEY = "healthbridge:userdata";

// ============================================================================
// CORE READ/WRITE
// ============================================================================

/**
 * Read user data from localStorage
 * If nothing is stored, returns seed data (and writes it so it persists)
 * Returns null if running server-side (no window)
 */
export function getUserData(): UserData | null {
  // Guard: only works in browser
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    // First-time user → seed with demo data
    if (!raw) {
      const seed = getSeedData();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }

    return JSON.parse(raw) as UserData;
  } catch (err) {
    console.error("Failed to read userData from localStorage:", err);
    return null;
  }
}

/**
 * Write user data to localStorage (full overwrite)
 */
export function setUserData(data: UserData): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("Failed to write userData to localStorage:", err);
  }
}

/**
 * Update user data with a partial patch
 * Reads current → merges patch → writes back
 * Returns the updated data
 */
export function updateUserData(patch: Partial<UserData>): UserData | null {
  const current = getUserData();
  if (!current) return null;

  const updated: UserData = {
    ...current,
    ...patch,
    // Once user modifies anything, mark as no longer pure seed data
    isSeedData: false,
  };
  setUserData(updated);
  return updated;
}

/**
 * Clear all user data and re-seed with fresh demo data
 * Used by "Reset Demo Data" button
 */
export function resetUserData(): UserData {
  const seed = getSeedData();
  setUserData(seed);
  return seed;
}

// ============================================================================
// CONVENIENCE HELPERS
// ============================================================================

/**
 * Add or update today's wellness entry
 * Replaces existing entry for today, or appends a new one
 */
export function upsertTodayWellnessEntry(
  entry: Omit<UserData["wellnessLog"][number], "createdAt" | "updatedAt">
): UserData | null {
  const current = getUserData();
  if (!current) return null;

  const now = new Date().toISOString();
  const existingIndex = current.wellnessLog.findIndex(
    (e) => e.date === entry.date
  );

  let newLog;
  if (existingIndex >= 0) {
    // Update existing entry, preserving createdAt
    newLog = [...current.wellnessLog];
    newLog[existingIndex] = {
      ...entry,
      createdAt: current.wellnessLog[existingIndex].createdAt,
      updatedAt: now,
    };
  } else {
    // Append new entry
    newLog = [...current.wellnessLog, { ...entry, createdAt: now, updatedAt: now }];
  }

  return updateUserData({ wellnessLog: newLog });
}

/**
 * Get today's wellness entry (if any)
 */
export function getTodayWellnessEntry(): UserData["wellnessLog"][number] | null {
  const data = getUserData();
  if (!data) return null;

  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  return data.wellnessLog.find((e) => e.date === today) ?? null;
}
