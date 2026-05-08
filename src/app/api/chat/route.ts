import { NextRequest, NextResponse } from "next/server";

interface ChatRequest {
  message: string;
  planText?: string;
  healthData?: string;
  symptomHistory?: string;
  agent?: string;
}

interface ChatResponse {
  response: string;
  agent: string;
  timestamp: string;
}

interface ErrorResponse {
  error: string;
  code: string;
  timestamp: string;
}

function getMockResponse(message: string): string {
  const m = message.toLowerCase();

  if (/copay|coverage|deductible|insurance|plan|claim|benefit/.test(m)) {
    return `Based on your **Gold PPO plan**, here's what I found:

- **Primary care visits:** $25 copay
- **Specialist visits:** $50 copay
- **Emergency room:** $350 copay (waived if admitted)
- **Annual deductible:** $1,500 (individual) / $3,000 (family)
- **Out-of-pocket maximum:** $6,000 / year

You've met **$420 of your $1,500 deductible** so far this year. Would you like me to check coverage for a specific procedure or medication?`;
  }

  if (/medication|prescription|drug|refill|metformin|lisinopril/.test(m)) {
    return `I can see your current medications on file:

1. **Metformin 500mg** — Take twice daily with meals. Next refill due in **8 days**.
2. **Lisinopril 10mg** — Take once daily in the morning. Refills remaining: 3.

Your plan covers both at **Tier 1 pricing ($10 copay)**. Would you like me to locate the nearest in-network pharmacy or check for any drug interactions?`;
  }

  if (/appointment|doctor|visit|schedule|upcoming/.test(m)) {
    return `You have **2 upcoming appointments**:

📅 **Dr. Sarah Chen – Cardiology**
May 15, 2026 at 10:30 AM · Toronto General Hospital

📅 **Dr. Michael Torres – Annual Physical**
May 28, 2026 at 2:00 PM · Midtown Family Health Clinic

Both providers are **in-network** under your Gold PPO plan. Would you like directions, or do you need to reschedule?`;
  }

  if (/symptom|headache|pain|tired|fatigue|fever|cough|sick/.test(m)) {
    return `I've reviewed your recent symptom history. Based on the **3 headache entries** logged over the past 2 weeks and your current sleep average of 5.8 hrs, this pattern is consistent with tension headaches or dehydration.

**Recommendations:**
- Aim for 8+ cups of water daily
- Improve sleep to 7–8 hrs (currently averaging 5.8 hrs)
- If headaches persist more than 3 days or worsen, see Dr. Chen

Should I flag this for your appointment on May 15th?`;
  }

  if (/heart rate|blood pressure|glucose|weight|wellness|health/.test(m)) {
    return `Here's a summary of your recent wellness metrics:

| Metric | Latest | Status |
|--------|--------|--------|
| Heart rate | 72 bpm | ✅ Normal |
| Blood pressure | 118/76 | ✅ Normal |
| Blood glucose | 94 mg/dL | ✅ Normal |
| Weight | 154 lbs | → Stable |
| Sleep | 5.8 hrs avg | ⚠️ Below target |

Your cardiovascular indicators look great. The main area to focus on is **sleep quality**. Want tips on improving your sleep routine?`;
  }

  if (/find|doctor|provider|clinic|hospital|near/.test(m)) {
    return `Based on your **Gold PPO plan**, here are in-network providers near you:

🏥 **Midtown Family Health Clinic** — 0.4 km
Accepting new patients · (416) 555-0192

🏥 **Toronto General Hospital** — 1.2 km
Full-service · ER available 24/7

🏥 **Rosedale Medical Centre** — 1.8 km
Accepting new patients · (416) 555-0847

All three are in-network with a $25 copay for primary care visits. Would you like to book an appointment?`;
  }

  if (/emergency|urgent|911/.test(m)) {
    return `⚠️ If this is a medical emergency, please call **911** immediately.

For urgent but non-emergency situations, your plan covers **urgent care at $75 copay** — much less than the $350 ER copay.

**Nearest urgent care open now:**
MedFirst Urgent Care — 0.8 km · Open until 10 PM

Would you like directions?`;
  }

  return `I'm your HealthBridge AI assistant, powered by **IBM watsonx Orchestrate**.

I can help you with:
- 📋 Insurance coverage, copays, and claims
- 💊 Medication info and refill reminders
- 📅 Appointments and provider lookup
- 📊 Wellness metrics and health trends
- 🩺 Symptom guidance based on your history

What would you like to know?`;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as ChatRequest;

    if (!body.message?.trim()) {
      return NextResponse.json(
        { error: "Message cannot be empty", code: "EMPTY_MESSAGE", timestamp: new Date().toISOString() } as ErrorResponse,
        { status: 400 }
      );
    }

    // Simulate realistic response time
    await new Promise((r) => setTimeout(r, 900 + Math.random() * 700));

    const response: ChatResponse = {
      response: getMockResponse(body.message),
      agent: "IBM watsonx Orchestrate — HealthGuide",
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: msg, code: "ERROR", timestamp: new Date().toISOString() } as ErrorResponse,
      { status: 500 }
    );
  }
}
