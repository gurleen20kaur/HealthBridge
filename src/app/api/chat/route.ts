/**
 * POST /api/chat
 *
 * Main chat endpoint that bridges the React browser and Orchestrate agents
 *
 * Request from browser:
 *   POST /api/chat
 *   {
 *     "message": "What's my copay?",
 *     "planText": "Gold PPO, ER copay: $350...",  (optional)
 *     "healthData": "Heart rate: 78bpm...",       (optional)
 *     "symptomHistory": "Headaches 2x/week...",   (optional)
 *     "agent": "CoverageAdvisor"                  (optional, default: HealthGuide)
 *   }
 *
 * Response to browser:
 *   200 OK
 *   {
 *     "response": "Based on your plan, ER copay is $350...",
 *     "agent": "CoverageAdvisor",
 *     "timestamp": "2026-05-02T18:45:30.123Z"
 *   }
 *
 * Error responses:
 *   400 Bad Request: message is missing or empty
 *   500 Internal Server Error: Orchestrate failed or auth failed
 */

import { NextRequest, NextResponse } from "next/server";
import { sendMessage } from "@/lib/orchestrate";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * What the browser sends to this endpoint
 */
interface ChatRequest {
  message: string; // Required: the user's question
  planText?: string; // Optional: insurance plan text (from PDF extraction)
  healthData?: string; // Optional: health metrics (from CSV export)
  symptomHistory?: string; // Optional: symptom log
  agent?: string; // Optional: which agent to target (default: HealthGuide)
}

/**
 * What this endpoint returns to the browser
 */
interface ChatResponse {
  response: string; // Agent's answer
  agent: string; // Which agent processed it
  timestamp: string; // When the response was generated
}

/**
 * Error response when something goes wrong
 */
interface ErrorResponse {
  error: string; // Human-readable error message
  code: string; // Machine-readable error code
  timestamp: string; // When the error occurred
}

// ============================================================================
// POST HANDLER
// ============================================================================

/**
 * Handle POST requests to /api/chat
 * Browser calls this with a message and optional context
 * We call Orchestrate and return the agent's response
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  console.log("🚪 POST /api/chat received");
  try {
    // Read raw body first to see what's actually arriving
    const rawBody = await request.text();
    console.log("📩 Raw request body:", rawBody.substring(0, 200));

    const body = JSON.parse(rawBody) as ChatRequest;

    // Validate: message is required
    if (!body.message || !body.message.trim()) {
      console.warn("❌ Invalid request: message is empty");
      return NextResponse.json(
        {
          error: "Message cannot be empty",
          code: "EMPTY_MESSAGE",
          timestamp: new Date().toISOString(),
        } as ErrorResponse,
        { status: 400 } // HTTP 400 = Bad Request (user's fault)
      );
    }

    // Log the incoming request (helpful for debugging)
    console.log(`📨 Chat request: "${body.message.substring(0, 50)}..."`);

    // Call orchestrate.sendMessage() with the user's message and context
    // This is where the magic happens:
    // 1. Gets IAM token (ibm-auth.ts)
    // 2. Constructs prompt with injected context (orchestrate.ts)
    // 3. Calls Orchestrate agent
    // 4. Returns response
    const agentResponse = await sendMessage(body.message, {
      planText: body.planText,
      healthData: body.healthData,
      symptomHistory: body.symptomHistory,
    });

    // Allow targeting a specific agent if the browser specified one
    // (Note: sendMessage() defaults to HealthGuide as supervisor)
    if (body.agent) {
      agentResponse.agent = body.agent;
    }

    // Success! Return the agent's response to the browser
    console.log(`✅ Chat response sent (${agentResponse.response.length} chars)`);
    return NextResponse.json(agentResponse, { status: 200 }); // HTTP 200 = OK
  } catch (error) {
    // Something went wrong (auth failed, Orchestrate is down, etc.)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error("❌ Chat endpoint error:", errorMessage);

    // Return error to browser with HTTP 500
    // (Server's fault, not the browser's fault)
    return NextResponse.json(
      {
        error: `Failed to get response from Orchestrate: ${errorMessage}`,
        code: "ORCHESTRATE_ERROR",
        timestamp: new Date().toISOString(),
      } as ErrorResponse,
      { status: 500 } // HTTP 500 = Internal Server Error
    );
  }
}
