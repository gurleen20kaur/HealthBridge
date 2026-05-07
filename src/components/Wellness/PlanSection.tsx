/**
 * PlanSection — insurance plan upload card on the Wellness page
 *
 * Shows current plan status if loaded; otherwise lets user upload a PDF.
 * On upload: POSTs to /api/parse-plan, then writes the extracted text into
 * userData.insurancePlan via the parent's update callback.
 */

"use client";

import { useRef, useState } from "react";
import { UserData } from "@/types";

interface PlanSectionProps {
  userData: UserData;
  onUpdate: (patch: Partial<UserData>) => void;
}

export function PlanSection({ userData, onUpdate }: PlanSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const plan = userData.insurancePlan;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.includes("pdf")) {
      setError("Please select a PDF file");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/parse-plan", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to parse PDF");
      }

      const data = await response.json();
      onUpdate({
        insurancePlan: {
          text: data.text,
          fileName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    if (confirm("Remove the saved insurance plan?")) {
      onUpdate({ insurancePlan: null });
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">📄 Insurance Plan</h2>
        {plan && (
          <button
            onClick={handleRemove}
            className="text-xs text-slate-500 hover:text-red-600 transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      {plan ? (
        <div className="space-y-3">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <p className="text-sm font-medium text-green-800">
              ✓ {plan.fileName}
            </p>
            <p className="text-xs text-green-700 mt-1">
              {plan.text.length.toLocaleString()} characters loaded · the AI uses
              this to answer coverage questions
            </p>
          </div>

          <details className="text-sm text-slate-600">
            <summary className="cursor-pointer hover:text-slate-900 font-medium">
              Preview plan content
            </summary>
            <div className="mt-2 bg-slate-50 rounded-xl p-3 max-h-40 overflow-y-auto font-mono text-xs whitespace-pre-wrap">
              {plan.text.substring(0, 600)}
              {plan.text.length > 600 ? "…" : ""}
            </div>
          </details>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full text-sm text-teal-700 hover:text-teal-800 font-medium py-2 transition-colors"
          >
            {isUploading ? "Uploading…" : "Upload a different plan"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-slate-600">
            Upload your plan PDF so the AI can answer questions about your specific
            coverage, copays, and deductibles.
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-slate-300 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {isUploading ? "Parsing PDF…" : "Upload PDF"}
          </button>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-2 rounded-lg">{error}</p>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
}
