/**
 * useUserData hook
 *
 * Provides reactive access to UserData in localStorage. Components can:
 *   const { userData, update, reset, isLoading } = useUserData();
 *
 * - userData: the current UserData (null while loading on first render, then never null)
 * - update(patch): merges patch into userData and writes back
 * - reset(): clears localStorage and re-seeds with demo data
 * - isLoading: true on the first server render, false once mounted in browser
 *
 * Why isLoading? Next.js renders pages on the server first (where localStorage
 * doesn't exist). We can't read userData until we mount in the browser, so
 * the first render returns null + isLoading=true. After useEffect runs,
 * userData is populated.
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { UserData } from "@/types";
import {
  getUserData,
  updateUserData as updateStorage,
  resetUserData as resetStorage,
} from "@/lib/storage";

interface UseUserDataResult {
  userData: UserData | null;
  isLoading: boolean;
  update: (patch: Partial<UserData>) => void;
  reset: () => void;
}

export function useUserData(): UseUserDataResult {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load from localStorage once on mount (browser-only)
  useEffect(() => {
    const data = getUserData();
    setUserData(data);
    setIsLoading(false);
  }, []);

  // Update: merge patch, persist, and update React state
  const update = useCallback((patch: Partial<UserData>) => {
    const updated = updateStorage(patch);
    if (updated) setUserData(updated);
  }, []);

  // Reset: clear and reseed
  const reset = useCallback(() => {
    const seed = resetStorage();
    setUserData(seed);
  }, []);

  return { userData, isLoading, update, reset };
}
