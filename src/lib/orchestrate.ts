/**
 * Orchestrate API Client Module
 *
 * This module handles communication with your IBM Orchestrate agents:
 * 1. Receives user message + optional context (plan text, health data)
 * 2. Constructs a prompt that injects context into the message
 * 3. Gets IAM token from ibm-auth.ts
 * 4. Sends prompt to Orchestrate agent
 * 5. Parses response and extracts agent's answer
 *
 * Key concept: Context Injection
 * Instead of uploading PDFs to IBM, we extract text and inject it into
 * the prompt. The agent reads BOTH general knowledge + injected context.
 */

import { getIAMToken } from "./ibm-auth";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Context object: User data to inject into prompts
 * All fields are optional. If provided, they're injected at the top of the prompt.
 */
interface MessageContext {
  /**
   * planText: Insurance plan details extracted from PDF
   * Example: "Plan: Gold PPO, Deductible: $1,500, ER copay: $350 + 20%"
   * Injected so agent can answer insurance questions about THIS specific plan
   */
  planText?: string;

  /**
   * healthData: User's health metrics (e.g., from Apple Health export)
   * Example: "Heart rate: avg 78 bpm, steps: avg 6,200/day"
   * Injected so agent can spot trends or concerning patterns
   */
  healthData?: string;

  /**
   * symptomHistory: Previous symptoms user reported
   * Example: "Headaches 2x/week, fatigue for 3 weeks, no fever"
   * Injected so agent understands the full picture
   */
  symptomHistory?: string;
}

/**
 * Response from sendMessage()
 * Includes both the agent's answer and metadata about which agent responded
 */
interface OrchestrateResponse {
  response: string; // The agent's answer
  agent: string; // Which agent handled it (HealthGuide, SymptomInsight, CoverageAdvisor)
  timestamp: string; // ISO 8601 timestamp when response was generated
}

/**
 * Expected shape of Orchestrate API response
 */
// OpenAI-compatible response from IBM Orchestrate chat/completions
interface OrchestrateAPIResponse {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string;
    };
  }>;
  model?: string;
  thread_id?: string;
  [key: string]: any;
}

// ============================================================================
// HELPER: Construct the prompt with injected context
// ============================================================================

/**
 * Builds the full prompt by injecting context above the user's message
 *
 * Example without context:
 *   "What's my copay for an ER visit?"
 *
 * Example with context:
 *   "Insurance Plan Information:
 *    Plan Type: Gold PPO
 *    Deductible: $1,500 (met: $890)
 *    ER Copay: $350 + 20% coinsurance
 *
 *    User Question: What's my copay for an ER visit?"
 *
 * This way, the agent sees BOTH:
 * - General insurance knowledge from training
 * - User's SPECIFIC plan details (injected context)
 */
function constructPrompt(userMessage: string, context?: MessageContext): string {
  // Start with optional context sections
  let prompt = "";

  // If user provided insurance plan info, add it first
  if (context?.planText) {
    prompt += `Insurance Plan Information:\n${context.planText}\n\n`;
  }

  // If user provided health data, add it
  if (context?.healthData) {
    prompt += `Your Health Data:\n${context.healthData}\n\n`;
  }

  // If user provided symptom history, add it
  if (context?.symptomHistory) {
    prompt += `Symptom History:\n${context.symptomHistory}\n\n`;
  }

  // Finally, add the user's actual question
  prompt += `User Question: ${userMessage}`;

  return prompt;
}

// ============================================================================
// MAIN EXPORT: Send message to Orchestrate agent
// ============================================================================

/**
 * Send a message to your Orchestrate agents
 *
 * Usage:
 *   const response = await sendMessage(
 *     "What's my ER copay?",
 *     { planText: "Gold PPO, ER copay: $350..." }
 *   );
 *   console.log(response.response);  // "Based on your plan, ER copay is $350..."
 *   console.log(response.agent);     // "CoverageAdvisor"
 *
 * @param userMessage - What the user typed (required)
 * @param context - Optional user data to inject (plan text, health data, symptoms)
 * @param targetAgent - Which agent to send to (default: "HealthGuide" routes to specialists)
 * @returns Agent's response with metadata
 */
export async function sendMessage(
  userMessage: string,
  context?: MessageContext,
  targetAgent: string = "HealthGuide"
): Promise<OrchestrateResponse> {
  // Validate input
  if (!userMessage || !userMessage.trim()) {
    throw new Error("User message cannot be empty");
  }

  const apiKey = process.env.WATSONX_API_KEY;
  if (!apiKey) throw new Error("WATSONX_API_KEY is not set in .env.local.");

  // Get IAM token as fallback — IBM Orchestrate REST API prefers the raw API
  // key header ("apikey <key>") which bypasses the JWT PEM kid validation error.
  console.log("📋 Getting IAM token (fallback)...");
  const token = await getIAMToken();

  // Step 2: Construct the full prompt by injecting context
  // If context is provided, it goes BEFORE the user's question
  console.log("🔨 Constructing prompt with context...");
  const prompt = constructPrompt(userMessage, context);

  // Log what we're sending (helpful for debugging)
  console.log(`📤 Sending to ${targetAgent}:\n${prompt.substring(0, 100)}...`);

  // Step 3: Prepare the HTTP request to Orchestrate
  // Endpoint: POST {baseUrl}/api/v1/orchestrate/{agentId}/chat/completions
  // - agentId goes in the URL path, not the body
  // - No instanceId needed
  const agentId = process.env.WATSONX_AGENT_ID;
  if (!agentId) {
    throw new Error("WATSONX_AGENT_ID is not set in .env.local.");
  }

  // Use the same host as the embed widget — the REST API lives on the same domain.
  // WATSONX_BASE_URL may have an "api." prefix that doesn't apply here; we
  // fall back to the known embed hostURL for the ca-tor region.
  const rawBase = process.env.WATSONX_BASE_URL ?? "";
  const hostUrl = rawBase
    .replace(/^https?:\/\/api\./, "https://")   // strip "api." subdomain if present
    .replace(/\/+$/, "");                        // strip trailing slash

  const orchestrateUrl = hostUrl
    ? `${hostUrl}/api/v1/orchestrate/${agentId}/chat/completions`
    : `https://ca-tor.watson-orchestrate.cloud.ibm.com/api/v1/orchestrate/${agentId}/chat/completions`;
  console.log("🔗 URL:", orchestrateUrl);

  // IBM uses OpenAI-compatible chat completions format.
  // stream: false so we get a single JSON response, not a streaming SSE stream.
  // Truncate prompt to 4000 chars to avoid IBM context limits.
  const truncatedPrompt = prompt.length > 4000
    ? prompt.substring(0, 4000) + "\n\n[Context truncated for length]"
    : prompt;

  const requestBody = {
    messages: [{ role: "user", content: truncatedPrompt }],
    stream: false,
    additional_parameters: {},
    context: {},
  };

  // Step 4: Make the HTTP POST request to Orchestrate
  console.log("🌐 Calling Orchestrate API...");
  const response = await fetch(orchestrateUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // IBM Orchestrate REST API accepts the raw API key directly — this avoids
      // the "WXO_PEM - kid not found" JWT validation error from using IAM tokens.
      Authorization: `apikey ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  // Step 5: Check if the request succeeded
  if (!response.ok) {
    // If Orchestrate returns an error, extract details
    const errorText = await response.text();
    console.error(
      `❌ Orchestrate error (${response.status}): ${errorText}`
    );
    throw new Error(
      `Orchestrate API failed (${response.status}): ${errorText}. ` +
        `Check that your agents are deployed and your token is valid.`
    );
  }

  // Step 6: Parse Orchestrate's response
  // Read raw text first so we can log it if JSON parsing fails
  const rawText = await response.text();
  console.log("📥 IBM raw response:", rawText.substring(0, 500));

  let data: OrchestrateAPIResponse;
  try {
    data = JSON.parse(rawText) as OrchestrateAPIResponse;
  } catch {
    throw new Error(`IBM returned non-JSON response: ${rawText.substring(0, 300)}`);
  }

  // IBM returns OpenAI-compatible format: choices[0].message.content
  const agentAnswer = data.choices?.[0]?.message?.content ?? "";

  if (!agentAnswer) {
    throw new Error(
      "Orchestrate returned empty response. Full response: " +
        JSON.stringify(data)
    );
  }

  // Step 7: Determine which agent processed this
  const agentUsed = data.model || targetAgent;

  // Step 8: Construct and return the response
  const result: OrchestrateResponse = {
    response: agentAnswer,
    agent: agentUsed,
    timestamp: new Date().toISOString(),
  };

  console.log(`✅ Got response from ${agentUsed}`);
  return result;
}
