/**
 * HealthBridge Home Page
 *
 * Main app container:
 * - Manages state: messages, insurance plan, symptoms
 * - Layout: sidebar + chat area
 * - Handles message sending (calls /api/chat)
 * - Routes context to child components
 */

"use client";

import { useState, useCallback } from "react";
import { Message, ChatRequest, ChatResponse } from "@/types";
import { ChatInterface } from "@/components/ChatInterface";
import { InsuranceUpload } from "@/components/InsuranceUpload";
import { SymptomTracker } from "@/components/SymptomTracker";

export default function Home() {
  // ========================================================================
  // STATE MANAGEMENT
  // ========================================================================

  // Chat messages (user + agent)
  const [messages, setMessages] = useState<Message[]>([]);

  // Insurance plan text (extracted from PDF)
  const [planText, setPlanText] = useState<string>();

  // Symptom history (from form)
  const [symptomHistory, setSymptomHistory] = useState<string>();

  // Loading state (while waiting for agent response)
  const [isLoading, setIsLoading] = useState(false);

  // Error message (if API call fails)
  const [error, setError] = useState<string | null>(null);

  // ========================================================================
  // MESSAGE SENDING
  // ========================================================================

  /**
   * Handle sending a message to the agent
   * 1. Create user message and add to chat
   * 2. Call POST /api/chat with context
   * 3. Add agent response to chat
   * 4. Handle errors
   */
  const handleSendMessage = useCallback(
    async (request: ChatRequest) => {
      // Prevent duplicate requests
      if (isLoading) return;

      // Generate unique ID for user message
      const userMessageId = `msg-${Date.now()}`;
      const timestamp = new Date().toISOString();

      // Create user message
      const userMessage: Message = {
        id: userMessageId,
        role: "user",
        content: request.message,
        timestamp,
      };

      // Add user message to chat immediately (optimistic update)
      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        // Call the backend API
        // POST /api/chat with: message, planText, symptomHistory
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        });

        // Check if response is OK
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to get response");
        }

        // Parse agent response
        const data = (await response.json()) as ChatResponse;

        // Create agent message
        const agentMessage: Message = {
          id: `msg-${Date.now()}-agent`,
          role: "agent",
          content: data.response,
          agent: data.agent,
          timestamp: data.timestamp,
        };

        // Add agent message to chat
        setMessages((prev) => [...prev, agentMessage]);
        setError(null);
      } catch (err) {
        // Handle error
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error";
        setError(errorMessage);
        console.error("Chat error:", err);

        // Add error message to chat
        const errorMsg: Message = {
          id: `msg-${Date.now()}-error`,
          role: "agent",
          content: `Sorry, I encountered an error: ${errorMessage}`,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading]
  );

  // ========================================================================
  // RENDER
  // ========================================================================

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-900">
      {/* SIDEBAR */}
      <aside className="w-80 bg-gray-50 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 overflow-y-auto p-4 space-y-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            HealthBridge
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            AI health assistant
          </p>
        </div>

        {/* Insurance Upload Component */}
        <InsuranceUpload planText={planText} onPlanExtracted={setPlanText} />

        {/* Symptom Tracker Component */}
        <SymptomTracker
          symptomHistory={symptomHistory}
          onSymptomsSaved={setSymptomHistory}
        />

        {/* Error alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-3">
            <p className="text-sm text-red-800 dark:text-red-100">{error}</p>
          </div>
        )}
      </aside>

      {/* MAIN CHAT AREA */}
      <main className="flex-1 flex flex-col bg-white dark:bg-gray-900">
        <ChatInterface
          messages={messages}
          isLoading={isLoading}
          planText={planText}
          symptomHistory={symptomHistory}
          onSendMessage={handleSendMessage}
        />
      </main>
    </div>
  );
}
