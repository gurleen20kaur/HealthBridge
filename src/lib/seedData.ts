/**
 * Demo seed data — rich 30-day dataset for the demo branch
 *
 * Pre-populates UserData so every chart, suggestion, and AI response
 * has meaningful content during a demo video.
 *
 * isSeedData: true keeps the "Demo Data" badge visible.
 * resetUserData() always re-seeds on this branch (see storage.ts).
 */

import { UserData, WellnessEntry, Appointment, Medication } from "@/types";

function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function dateTimeOffset(days: number, hours = 10): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hours, 0, 0, 0);
  return d.toISOString();
}

function seedWellnessLog(): WellnessEntry[] {
  const t = new Date().toISOString();

  // 30 days: realistic arc — rough start, recovery, good stretch, brief dip, strong finish
  const entries: Omit<WellnessEntry, "createdAt" | "updatedAt">[] = [
    // Week 1 — under the weather
    { date: dateOffset(-29), mood: 2, energy: 3, feelingNote: "Woke up with a sore throat and fatigue", pain: 5, sleepHours: 9, sleepQuality: 2 },
    { date: dateOffset(-28), mood: 2, energy: 3, feelingNote: "Still not great. Headache all day. Stayed home.", pain: 6, sleepHours: 9.5, sleepQuality: 2 },
    { date: dateOffset(-27), mood: 3, energy: 4, feelingNote: "Slight improvement. Headache lighter.", pain: 4, sleepHours: 8.5, sleepQuality: 3 },
    { date: dateOffset(-26), mood: 3, energy: 5, feelingNote: "Headache mostly gone. Still tired.", pain: 2, sleepHours: 8, sleepQuality: 3 },
    { date: dateOffset(-25), mood: 4, energy: 6, feelingNote: "Feeling more like myself. Short walk outside.", sleepHours: 7.5, sleepQuality: 4, exerciseMinutes: 20, exerciseType: "Walking" },
    { date: dateOffset(-24), mood: 4, energy: 7, feelingNote: "Good day overall. Appetite back to normal.", sleepHours: 7.5, sleepQuality: 4 },
    { date: dateOffset(-23), mood: 4, energy: 7, feelingNote: "Productive day, finished a big project at work.", sleepHours: 7, sleepQuality: 4, exerciseMinutes: 30, exerciseType: "Walking" },

    // Week 2 — on the mend
    { date: dateOffset(-22), mood: 5, energy: 8, feelingNote: "Feeling great! No headache, full energy.", sleepHours: 8, sleepQuality: 5, exerciseMinutes: 45, exerciseType: "Running" },
    { date: dateOffset(-21), mood: 4, energy: 7, feelingNote: "Solid day. Had a bit of neck stiffness.", pain: 2, sleepHours: 7.5, sleepQuality: 4 },
    { date: dateOffset(-20), mood: 5, energy: 8, feelingNote: "Best mood in weeks. Went hiking with friends.", sleepHours: 8, sleepQuality: 5, exerciseMinutes: 90, exerciseType: "Hiking" },
    { date: dateOffset(-19), mood: 4, energy: 7, feelingNote: "Slightly sore from hike but happy.", pain: 2, sleepHours: 8, sleepQuality: 4, exerciseMinutes: 20, exerciseType: "Stretching" },
    { date: dateOffset(-18), mood: 5, energy: 9, feelingNote: "Super productive and energized today!", sleepHours: 8, sleepQuality: 5, exerciseMinutes: 30, exerciseType: "Cycling" },
    { date: dateOffset(-17), mood: 4, energy: 8, feelingNote: "Good day. Ate healthy, stayed hydrated.", sleepHours: 7.5, sleepQuality: 4, exerciseMinutes: 25, exerciseType: "Walking" },
    { date: dateOffset(-16), mood: 4, energy: 7, feelingNote: "Calm weekend. Relaxed and recharged.", sleepHours: 9, sleepQuality: 5 },

    // Week 3 — consistent good stretch
    { date: dateOffset(-15), mood: 5, energy: 8, feelingNote: "Motivated start to the week!", sleepHours: 7.5, sleepQuality: 5, exerciseMinutes: 40, exerciseType: "Running" },
    { date: dateOffset(-14), mood: 4, energy: 7, feelingNote: "Regular day, nothing notable.", sleepHours: 7, sleepQuality: 4 },
    { date: dateOffset(-13), mood: 4, energy: 8, feelingNote: "Had a great lunch. Energy stayed high all day.", sleepHours: 7.5, sleepQuality: 4, exerciseMinutes: 30, exerciseType: "Walking" },
    { date: dateOffset(-12), mood: 5, energy: 8, feelingNote: "Really pleased with how the week is going.", sleepHours: 8, sleepQuality: 5, exerciseMinutes: 50, exerciseType: "Yoga" },
    { date: dateOffset(-11), mood: 4, energy: 7, feelingNote: "Little tired in the afternoon but recovered.", sleepHours: 7, sleepQuality: 3 },
    { date: dateOffset(-10), mood: 4, energy: 8, feelingNote: "Good sleep made a big difference today.", sleepHours: 8.5, sleepQuality: 5, exerciseMinutes: 35, exerciseType: "Running" },
    { date: dateOffset(-9), mood: 5, energy: 9, feelingNote: "Incredible day — feel on top of the world!", sleepHours: 8, sleepQuality: 5, exerciseMinutes: 60, exerciseType: "Hiking" },

    // Week 4 — brief dip (stress at work)
    { date: dateOffset(-8), mood: 3, energy: 5, feelingNote: "Stressful Monday. Fatigue crept back in.", pain: 3, sleepHours: 6, sleepQuality: 2 },
    { date: dateOffset(-7), mood: 2, energy: 4, feelingNote: "Deadline stress. Headache returned. Skipped exercise.", pain: 5, sleepHours: 5.5, sleepQuality: 2 },
    { date: dateOffset(-6), mood: 3, energy: 5, feelingNote: "Deadline met. Still tired but relieved.", pain: 3, sleepHours: 7, sleepQuality: 3 },
    { date: dateOffset(-5), mood: 3, energy: 6, feelingNote: "Recovering. Went for a short walk, helped.", sleepHours: 7.5, sleepQuality: 3, exerciseMinutes: 20, exerciseType: "Walking" },
    { date: dateOffset(-4), mood: 4, energy: 7, feelingNote: "Back to normal. Headache fully gone.", sleepHours: 8, sleepQuality: 4, exerciseMinutes: 30, exerciseType: "Walking" },

    // Last few days — strong finish
    { date: dateOffset(-3), mood: 4, energy: 7, feelingNote: "Good sleep, good mood. Did yoga this morning.", sleepHours: 8, sleepQuality: 4, exerciseMinutes: 40, exerciseType: "Yoga" },
    { date: dateOffset(-2), mood: 5, energy: 8, feelingNote: "Feeling energized. Took a long walk and felt great.", sleepHours: 8, sleepQuality: 5, exerciseMinutes: 45, exerciseType: "Walking" },
    { date: dateOffset(-1), mood: 5, energy: 9, feelingNote: "Best week in a while wrapping up nicely!", sleepHours: 8, sleepQuality: 5, exerciseMinutes: 50, exerciseType: "Running" },
  ];

  return entries.map((e) => ({ ...e, createdAt: t, updatedAt: t }));
}

function seedAppointments(): Appointment[] {
  return [
    // Past (completed)
    {
      id: "apt-past-1",
      date: dateTimeOffset(-18, 11),
      doctorName: "Dr. Sarah Chen",
      specialty: "Primary Care",
      reason: "Sick visit — sore throat and fatigue",
      location: "Downtown Medical Center",
      status: "completed",
    },
    {
      id: "apt-past-2",
      date: dateTimeOffset(-10, 9),
      doctorName: "Dr. Michael Reeves",
      specialty: "Cardiologist",
      reason: "Routine blood pressure check",
      location: "Heart Health Clinic",
      status: "completed",
    },
    // Upcoming
    {
      id: "apt-1",
      date: dateTimeOffset(4, 14),
      doctorName: "Dr. Sarah Chen",
      specialty: "Primary Care",
      reason: "Annual physical",
      location: "Downtown Medical Center",
      status: "upcoming",
    },
    {
      id: "apt-2",
      date: dateTimeOffset(12, 10),
      doctorName: "Dr. Michael Reeves",
      specialty: "Cardiologist",
      reason: "Follow-up on blood pressure",
      location: "Heart Health Clinic",
      status: "upcoming",
    },
    {
      id: "apt-3",
      date: dateTimeOffset(28, 9),
      doctorName: "Dr. Lisa Park",
      specialty: "Dermatologist",
      reason: "Annual skin check",
      location: "Skin & Wellness Center",
      status: "upcoming",
    },
  ];
}

function seedMedications(): Medication[] {
  return [
    {
      id: "med-1",
      name: "Lisinopril",
      dosage: "10mg",
      frequency: "Daily",
      startDate: dateOffset(-90),
      refillDate: dateOffset(5),
      notes: "Take in the morning with water",
    },
    {
      id: "med-2",
      name: "Metformin",
      dosage: "500mg",
      frequency: "Twice daily",
      startDate: dateOffset(-60),
      refillDate: dateOffset(14),
      notes: "Take with meals",
    },
    {
      id: "med-3",
      name: "Vitamin D3",
      dosage: "2000 IU",
      frequency: "Daily",
      startDate: dateOffset(-180),
      refillDate: dateOffset(22),
    },
  ];
}

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

export function getSeedData(): UserData {
  const now = new Date().toISOString();
  return {
    profile: {
      name: "Alex",
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
