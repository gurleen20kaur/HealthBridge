/**
 * Shared TypeScript types for Phase 3 frontend
 * These types ensure consistency between components and the backend API
 */

/**
 * A single message in the chat
 * Either from the user or from an agent
 */
export interface Message {
  id: string; // Unique identifier (timestamp + random)
  role: "user" | "agent"; // Who sent it
  content: string; // The message text
  agent?: string; // Which agent sent it (if role === "agent")
  timestamp: string; // ISO 8601 timestamp
}

/**
 * Request body for POST /api/chat
 * What the frontend sends when user submits a message
 */
export interface ChatRequest {
  message: string; // The user's message (required)
  planText?: string; // Insurance plan text (from PDF extraction)
  healthData?: string; // Health metrics (from CSV extraction)
  symptomHistory?: string; // Symptom notes (from form input)
  agent?: string; // Target agent name (optional, default: HealthGuide)
}

/**
 * Response from POST /api/chat
 * What the backend returns after calling Orchestrate
 */
export interface ChatResponse {
  response: string; // Agent's answer
  agent: string; // Which agent handled it
  timestamp: string; // ISO 8601 timestamp when response was generated
}

/**
 * Error response from API
 * Returned when something goes wrong
 */
export interface ErrorResponse {
  error: string; // Human-readable error message
  code: string; // Machine-readable error code (EMPTY_MESSAGE, ORCHESTRATE_ERROR, etc)
  timestamp: string; // When the error occurred
}

/**
 * Status of uploaded documents
 * Shows user what files have been uploaded
 */
export interface DocumentStatus {
  plan: {
    uploaded: boolean;
    fileName?: string;
    extractedChars?: number; // How many characters were extracted
  };
  healthData: {
    uploaded: boolean;
    fileName?: string;
    rows?: number; // How many rows in CSV
  };
}
