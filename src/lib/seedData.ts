/**
 * Demo seed data for first-time users
 *
 * Pre-populates UserData with 7 days of wellness entries, 3 upcoming
 * appointments, and 2 medications so the dashboard, history charts, and
 * AI suggestions all have meaningful content on first load.
 *
 * The `isSeedData: true` flag lets the UI show a "Demo Data" badge that
 * disappears once the user logs their own entry.
 */

import { UserData, WellnessEntry, Appointment, Medication } from "@/types";

/**
 * Format a date offset by N days from today
 * Negative N = past, positive N = future
 */
function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

function dateTimeOffset(days: number, hours = 10): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hours, 0, 0, 0);
  return d.toISOString();
}

/**
 * 7 days of wellness entries — mostly positive trend, one rough day to
 * demonstrate the AI suggestion engine flagging concerning patterns.
 */
function seedWellnessLog(): WellnessEntry[] {
  const baseTime = new Date().toISOString();
  return [
    // 6 days ago — feeling great
    {
      date: dateOffset(-6),
      mood: 4,
      energy: 8,
      feelingNote: "Productive day, slept well",
      sleepHours: 8,
      sleepQuality: 4,
      exerciseMinutes: 30,
      exerciseType: "Walking",
      createdAt: baseTime,
      updatedAt: baseTime,
    },
    // 5 days ago — solid
    {
      date: dateOffset(-5),
      mood: 4,
      energy: 7,
      feelingNote: "Felt good overall, mild headache in afternoon",
      pain: 3,
      sleepHours: 7.5,
      sleepQuality: 4,
      createdAt: baseTime,
      updatedAt: baseTime,
    },
    // 4 days ago — rough
    {
      date: dateOffset(-4),
      mood: 2,
      energy: 4,
      feelingNote: "Tired and a bit stressed. Headache returned.",
      pain: 5,
      sleepHours: 5.5,
      sleepQuality: 2,
      createdAt: baseTime,
      updatedAt: baseTime,
    },
    // 3 days ago — recovering
    {
      date: dateOffset(-3),
      mood: 3,
      energy: 5,
      feelingNote: "Better than yesterday but still low energy",
      pain: 3,
      sleepHours: 7,
      sleepQuality: 3,
      createdAt: baseTime,
      updatedAt: baseTime,
    },
    // 2 days ago — back on track
    {
      date: dateOffset(-2),
      mood: 4,
      energy: 7,
      feelingNote: "Headache gone! Did some yoga.",
      sleepHours: 8,
      sleepQuality: 4,
      exerciseMinutes: 45,
      exerciseType: "Yoga",
      createdAt: baseTime,
      updatedAt: baseTime,
    },
    // Yesterday
    {
      date: dateOffset(-1),
      mood: 5,
      energy: 8,
      feelingNote: "Great day! Energy is up.",
      sleepHours: 8,
      sleepQuality: 5,
      exerciseMinutes: 30,
      exerciseType: "Walking",
      createdAt: baseTime,
      updatedAt: baseTime,
    },
  ];
}

/**
 * 3 upcoming appointments spread across the next month
 */
function seedAppointments(): Appointment[] {
  return [
    {
      id: "apt-1",
      date: dateTimeOffset(4, 14), // 4 days from now, 2pm
      doctorName: "Dr. Sarah Chen",
      specialty: "Primary Care",
      reason: "Annual physical",
      location: "Downtown Medical Center",
      status: "upcoming",
    },
    {
      id: "apt-2",
      date: dateTimeOffset(12, 10), // 12 days from now, 10am
      doctorName: "Dr. Michael Reeves",
      specialty: "Cardiologist",
      reason: "Follow-up on blood pressure",
      location: "Heart Health Clinic",
      status: "upcoming",
    },
    {
      id: "apt-3",
      date: dateTimeOffset(28, 9), // 28 days from now, 9am
      doctorName: "Dr. Lisa Park",
      specialty: "Dermatologist",
      reason: "Skin check",
      location: "Skin & Wellness Center",
      status: "upcoming",
    },
  ];
}

/**
 * 2 medications — one with a refill date soon (triggers AI suggestion)
 */
function seedMedications(): Medication[] {
  return [
    {
      id: "med-1",
      name: "Lisinopril",
      dosage: "10mg",
      frequency: "Daily",
      startDate: dateOffset(-90),
      refillDate: dateOffset(5), // refill needed in 5 days → triggers suggestion
      notes: "Take in the morning",
    },
    {
      id: "med-2",
      name: "Vitamin D3",
      dosage: "2000 IU",
      frequency: "Daily",
      startDate: dateOffset(-180),
      refillDate: dateOffset(20),
    },
  ];
}

/**
 * Sample insurance plan text (what would normally come from PDF extraction)
 * Used so users can see how plan-aware coverage answers work without
 * needing to upload an actual PDF.
 */
const SEED_INSURANCE_TEXT = `Plan: Gold PPO
Member: Demo User
Group #: 12345
Effective: 2026-01-01

DEDUCTIBLE
- In-network: $1,500 individual / $3,000 family (paid: $890, remaining: $610)
- Out-of-network: $3,000 individual / $6,000 family

OUT-OF-POCKET MAXIMUM
- In-network: $5,000 individual / $10,000 family
- Out-of-network: $10,000 individual / $20,000 family

COPAYS (after deductible met for some services)
- Primary care visit: $25
- Specialist visit: $50
- Urgent care: $75
- Emergency room: $350 + 20% coinsurance after deductible
- Generic prescriptions: $10
- Brand-name prescriptions: $40
- Preventive care: $0 (covered 100%)

COVERED SERVICES
- Annual physicals, vaccinations, screenings: covered 100%
- Lab work and imaging: 80% after deductible
- Mental health counseling: $30 copay per session
- Physical therapy: 80% after deductible (max 30 visits/year)
- Maternity care: covered with applicable copays
`;

/**
 * Build the full seed UserData object
 */
export function getSeedData(): UserData {
  const now = new Date().toISOString();
  return {
    profile: {
      name: "Friend",
      createdAt: now,
    },
    wellnessLog: seedWellnessLog(),
    appointments: seedAppointments(),
    medications: seedMedications(),
    insurancePlan: {
      text: SEED_INSURANCE_TEXT,
      fileName: "Gold_PPO_Plan.pdf",
      uploadedAt: now,
    },
    chatHistory: [],
    isSeedData: true,
  };
}
