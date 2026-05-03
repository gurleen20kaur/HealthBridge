/**
 * InsuranceUpload Component
 *
 * Handles PDF file uploads:
 * - User selects PDF file
 * - Sends to POST /api/parse-plan
 * - Extracts text from PDF
 * - Stores in parent state (planText)
 * - Shows status: uploaded or error
 *
 * Usage:
 *   <InsuranceUpload
 *     planText={planText}
 *     onPlanExtracted={(text) => setPlanText(text)}
 *   />
 */

"use client";

import { useRef, useState } from "react";

interface InsuranceUploadProps {
  planText?: string;
  onPlanExtracted: (text: string) => void;
}

export function InsuranceUpload({ planText, onPlanExtracted }: InsuranceUploadProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.includes("pdf")) {
      setError("Please select a PDF file");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Create FormData to send the file
      const formData = new FormData();
      formData.append("file", file);

      // Send to backend for parsing
      const response = await fetch("/api/parse-plan", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to parse PDF");
      }

      // Extract text from response
      const data = await response.json();
      onPlanExtracted(data.text);
      setError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to upload: ${message}`);
      console.error("Upload error:", err);
    } finally {
      setIsLoading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
        📄 Insurance Plan
      </h3>

      {planText ? (
        <div className="space-y-3">
          {/* Plan loaded indicator */}
          <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 rounded-lg p-3">
            <p className="text-sm text-green-800 dark:text-green-100">
              ✓ Plan loaded ({Math.round(planText.length / 100)} KB)
            </p>
          </div>

          {/* Plan preview */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 max-h-24 overflow-y-auto">
            <p className="text-xs text-gray-600 dark:text-gray-300 font-mono line-clamp-4">
              {planText.substring(0, 200)}...
            </p>
          </div>

          {/* Upload new file button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white text-sm py-2 rounded-lg transition-colors"
          >
            {isLoading ? "Uploading..." : "Upload Different Plan"}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Upload prompt */}
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Upload your insurance plan PDF to get personalized coverage advice
          </p>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg p-3">
              <p className="text-sm text-red-800 dark:text-red-100">{error}</p>
            </div>
          )}

          {/* Upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg transition-colors"
          >
            {isLoading ? "Uploading..." : "Upload PDF"}
          </button>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
            disabled={isLoading}
          />

          {/* Help text */}
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Supported: PDF files up to 10MB
          </p>
        </div>
      )}
    </div>
  );
}
