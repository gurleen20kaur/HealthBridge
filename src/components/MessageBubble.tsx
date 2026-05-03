/**
 * MessageBubble Component
 *
 * Displays a single chat message
 * - User messages: right-aligned, blue background
 * - Agent messages: left-aligned, grey background, with agent name badge
 *
 * Usage:
 *   <MessageBubble
 *     message={{
 *       id: "msg-1",
 *       role: "user",
 *       content: "What's my copay?",
 *       timestamp: "2026-05-02T18:45:30Z"
 *     }}
 *   />
 */

"use client";

import { Message } from "@/types";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  // User messages appear on the right side with blue background
  if (message.role === "user") {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-blue-500 text-white rounded-lg px-4 py-2 max-w-xs md:max-w-md">
          <p className="text-sm">{message.content}</p>
          <span className="text-xs opacity-70 mt-1 block">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
      </div>
    );
  }

  // Agent messages appear on the left side with grey background
  return (
    <div className="flex justify-start mb-4">
      <div className="bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg px-4 py-2 max-w-xs md:max-w-md">
        {/* Agent name badge */}
        {message.agent && (
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded">
              {message.agent}
            </span>
          </div>
        )}

        {/* Message content */}
        <p className="text-sm">{message.content}</p>

        {/* Timestamp */}
        <span className="text-xs opacity-60 mt-1 block">
          {new Date(message.timestamp).toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}
