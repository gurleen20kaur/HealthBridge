/**
 * Shared TypeScript types for HealthBridge
 *
 * Phase 3: Chat-related types (Message, ChatRequest, ChatResponse)
 * Phase 4: Wellness platform types (UserData, WellnessEntry, Appointment, Medication)
 */

// ============================================================================
// PHASE 3: Chat types
// ============================================================================

export interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  agent?: string;
  timestamp: string;
}

export interface ChatRequest {
  message: string;
  planText?: string;
  healthData?: string;
  symptomHistory?: string;
  agent?: string;
}

export interface ChatResponse {
  response: string;
  agent: string;
  timestamp: string;
}

export interface ErrorResponse {
  error: string;
  code: string;
  timestamp: string;
}

// ============================================================================
// PHASE 4: Wellness platform types
// ============================================================================

/**
 * A daily wellness entry
 * Keyed by date (YYYY-MM-DD) so each day has at most one entry
 */
export interface WellnessEntry {
  date: string; // YYYY-MM-DD (the day this entry is for)
  mood: number; // 1-5 (sad → happy)
  energy: number; // 1-10 (drained → energized)
  feelingNote: string; // "How are you feeling today?" free text

  // Optional fields (progressive disclosure — only shown when user expands)
  pain?: number; // 0-10 (none → severe)
  sleepHours?: number; // hours slept last night
  sleepQuality?: number; // 1-5
  exerciseMinutes?: number;
  exerciseType?: string; // "Walking", "Yoga", etc.
  medicationsTaken?: string[]; // medication IDs taken today
  dietNotes?: string;

  createdAt: string; // ISO timestamp when first created
  updatedAt: string; // ISO timestamp of last edit
}

/**
 * A scheduled (or past) medical appointment
 */
export interface Appointment {
  id: string; // unique ID
  date: string; // ISO datetime
  doctorName: string;
  specialty: string; // "Primary Care", "Cardiologist", etc.
  reason: string; // why this appointment
  location: string; // clinic/hospital name
  notes?: string;
  status: "upcoming" | "completed" | "cancelled";
}

/**
 * A medication the user is currently taking
 */
export interface Medication {
  id: string;
  name: string;
  dosage: string; // "500mg", "10ml"
  frequency: string; // "Daily", "Twice daily", "As needed"
  startDate: string; // YYYY-MM-DD
  refillDate?: string; // YYYY-MM-DD when to refill
  notes?: string;
}

/**
 * User profile (basic info)
 */
export interface UserProfile {
  name: string;
  createdAt: string;
}

/**
 * Insurance plan info
 */
export interface InsurancePlan {
  text: string; // extracted PDF text
  fileName: string;
  uploadedAt: string;
}

/**
 * Top-level shape of all user data persisted in localStorage
 * Single key: "healthbridge:userdata"
 */
export interface UserData {
  profile: UserProfile;
  wellnessLog: WellnessEntry[];
  appointments: Appointment[];
  medications: Medication[];
  insurancePlan: InsurancePlan | null;
  chatHistory: Message[];
  isSeedData: boolean; // true if this is demo seed data, false after user clears
}

/**
 * AI suggestion shown on dashboard
 * Generated dynamically from UserData
 */
export interface Suggestion {
  id: string;
  icon: string; // emoji
  title: string;
  prompt: string; // prefilled prompt sent to chat when clicked
  agent?: string; // which Orchestrate agent should handle it
  priority: "high" | "medium" | "low";
}
