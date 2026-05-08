"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useUserData } from "@/hooks/useUserData";
import { Message, ChatResponse } from "@/types";
import { buildChatRequest } from "@/lib/contextBuilder";
import { MessageBubble } from "@/components/MessageBubble";
import { SuggestionChips } from "@/components/Chat/SuggestionChips";
import { ContextSidebar } from "@/components/Chat/ContextSidebar";

function ChatPageContent() {
  const { userData, isLoading, update } = useUserData();
  const searchParams = useSearchParams();

  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const handledUrlParam = useRef(false);

  const messages = userData?.chatHistory ?? [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (handledUrlParam.current || isLoading || !userData) return;
    const promptParam = searchParams.get("prompt");
    if (promptParam) {
      setInputValue(promptParam);
      handledUrlParam.current = true;
    }
  }, [searchParams, isLoading, userData]);

  const handleSend = useCallback(
    async (overrideMessage?: string) => {
      const messageText = overrideMessage ?? inputValue;
      if (!messageText.trim() || isSending || !userData) return;

      const targetAgent = searchParams.get("agent") ?? undefined;

      const userMsg: Message = {
        id: `msg-${Date.now()}`,
        role: "user",
        content: messageText,
        timestamp: new Date().toISOString(),
      };
      const newHistoryWithUser = [...messages, userMsg];
      update({ chatHistory: newHistoryWithUser });

      setInputValue("");
      setIsSending(true);
      setError(null);

      try {
        const requestBody = buildChatRequest(messageText, userData, targetAgent);
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to get response");
        }

        const data = (await response.json()) as ChatResponse;
        const agentMsg: Message = {
          id: `msg-${Date.now()}-agent`,
          role: "agent",
          content: data.response,
          agent: data.agent,
          timestamp: data.timestamp,
        };
        update({ chatHistory: [...newHistoryWithUser, agentMsg] });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : "Unknown error";
        setError(errMsg);
        const errorBubble: Message = {
          id: `msg-${Date.now()}-error`,
          role: "agent",
          content: `Sorry, I couldn't get a response: ${errMsg}`,
          timestamp: new Date().toISOString(),
        };
        update({ chatHistory: [...newHistoryWithUser, errorBubble] });
      } finally {
        setIsSending(false);
      }
    },
    [inputValue, isSending, userData, messages, searchParams, update]
  );

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearHistory = () => {
    if (confirm("Clear chat history? This won't affect your wellness data.")) {
      update({ chatHistory: [] });
    }
  };

  if (isLoading || !userData) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse text-slate-400">Loading…</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">💬 Chat with HealthBridge AI</h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            Personalized to your plan, wellness, and history.
            <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-medium">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none"/>
              </svg>
              IBM watsonx Orchestrate
            </span>
          </p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="text-sm text-slate-500 hover:text-red-600 transition-colors"
          >
            Clear chat
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat area */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-md flex flex-col" style={{ minHeight: "70vh" }}>
          <div className="flex-1 overflow-y-auto p-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center text-slate-400 py-12">
                <span className="text-5xl mb-3">💚</span>
                <h2 className="text-xl font-semibold text-slate-700 mb-2">
                  How can I help today?
                </h2>
                <p className="text-sm max-w-sm">
                  Ask me about your insurance plan, symptoms, medications, or
                  anything health-related. I see your latest wellness data.
                </p>
              </div>
            ) : (
              <>
                {messages.map((m) => (
                  <MessageBubble key={m.id} message={m} />
                ))}
                {isSending && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-slate-100 rounded-2xl px-4 py-3">
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                        <span>IBM watsonx Orchestrate</span>
                      </div>
                      <div className="flex gap-2">
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          <div className="border-t border-slate-100 p-4 space-y-3">
            <SuggestionChips
              userData={userData}
              onSelect={(prompt) => setInputValue(prompt)}
              disabled={isSending}
            />
            <div className="flex gap-2">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about your health, plan, symptoms..."
                disabled={isSending}
                rows={2}
                className="flex-1 p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none disabled:opacity-50"
              />
              <button
                onClick={() => handleSend()}
                disabled={isSending || !inputValue.trim()}
                className="bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 text-white font-semibold px-6 rounded-xl transition-colors self-stretch"
              >
                {isSending ? "…" : "Send"}
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Press Enter to send · Shift+Enter for new line
            </p>
            {error && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>
            )}
          </div>
        </div>

        {/* Context sidebar */}
        <div className="lg:col-span-1">
          <ContextSidebar userData={userData} />
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="animate-pulse text-slate-400">Loading…</div>
        </div>
      }
    >
      <ChatPageContent />
    </Suspense>
  );
}
