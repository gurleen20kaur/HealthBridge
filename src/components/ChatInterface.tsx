/**
 * ChatInterface Component
 *
 * Main chat area:
 * - Displays all messages (user + agent)
 * - Input box for user to type
 * - Send button
 * - Loading indicator while waiting for agent response
 * - Auto-scrolls to latest message
 *
 * Usage:
 *   <ChatInterface
 *     messages={messages}
 *     isLoading={isLoading}
 *     onSendMessage={(userMessage, context) => { ... }}
 *   />
 */

"use client";

import { useRef, useEffect, useState } from "react";
import { Message, ChatRequest } from "@/types";
import { MessageBubble } from "./MessageBubble";

interface ChatInterfaceProps {
  messages: Message[];
  isLoading: boolean;
  planText?: string;
  symptomHistory?: string;
  onSendMessage: (request: ChatRequest) => Promise<void>;
}

export function ChatInterface({
  messages,
  isLoading,
  planText,
  symptomHistory,
  onSendMessage,
}: ChatInterfaceProps) {
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Handle send button click
  const handleSend = async () => {
    if (!inputValue.trim()) {
      return; // Don't send empty messages
    }

    // Build the request with optional context
    const request: ChatRequest = {
      message: inputValue,
      planText: planText || undefined,
      symptomHistory: symptomHistory || undefined,
    };

    try {
      // Call the parent's send handler
      await onSendMessage(request);
      // Clear input on success
      setInputValue("");
    } catch (error) {
      // Error is handled by parent, just log here
      console.error("Failed to send message:", error);
    }
  };

  // Handle Enter key to send
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <h2 className="text-2xl font-semibold mb-2">HealthBridge</h2>
              <p>Start by asking a health question</p>
              {planText && <p className="text-sm mt-2">📄 Insurance plan loaded</p>}
              {symptomHistory && <p className="text-sm mt-2">📝 Symptoms saved</p>}
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isLoading && (
              <div className="flex justify-start mb-4">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-lg px-4 py-2">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-300 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-800">
        <div className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about your health or insurance..."
            disabled={isLoading}
            className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            rows={2}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors self-end"
          >
            {isLoading ? "..." : "Send"}
          </button>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
