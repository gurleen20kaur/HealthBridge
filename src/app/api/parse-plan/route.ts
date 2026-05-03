/**
 * POST /api/parse-plan
 *
 * Parses insurance plan PDF files
 *
 * Request:
 *   Content-Type: multipart/form-data
 *   Body: { file: <PDF file> }
 *
 * Response:
 *   200 OK
 *   { "text": "extracted plan text here..." }
 *
 * Error responses:
 *   400 Bad Request: No file provided or not a PDF
 *   500 Internal Server Error: PDF parsing failed
 */

import { NextRequest, NextResponse } from "next/server";
import pdf from "pdf-parse";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface ParsePlanResponse {
  text: string;
  fileName: string;
  pages: number;
}

interface ErrorResponse {
  error: string;
  code: string;
}

// ============================================================================
// POST HANDLER
// ============================================================================

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse the multipart form data
    // InsuranceUpload.tsx sends: new FormData(); formData.append("file", file);
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    // Validate: file must exist
    if (!file) {
      console.warn("❌ Parse-plan error: No file provided");
      return NextResponse.json(
        {
          error: "No file provided",
          code: "NO_FILE",
        } as ErrorResponse,
        { status: 400 }
      );
    }

    // Validate: must be a PDF
    if (!file.type.includes("pdf")) {
      console.warn(`❌ Parse-plan error: Invalid file type: ${file.type}`);
      return NextResponse.json(
        {
          error: "File must be a PDF",
          code: "INVALID_FILE_TYPE",
        } as ErrorResponse,
        { status: 400 }
      );
    }

    // Log the upload
    console.log(`📄 Parsing insurance plan PDF: ${file.name} (${file.size} bytes)`);

    // Read the file as a Buffer
    // This is needed because pdf-parse expects a Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF using pdf-parse
    // pdf() returns: { numpages, version, text, ... }
    const data = await pdf(buffer);

    // The extracted text
    const extractedText = data.text;

    if (!extractedText || extractedText.trim().length === 0) {
      console.warn("❌ Parse-plan error: PDF is empty or text extraction failed");
      return NextResponse.json(
        {
          error: "Could not extract text from PDF",
          code: "EXTRACTION_FAILED",
        } as ErrorResponse,
        { status: 400 }
      );
    }

    // Success! Return the extracted text
    console.log(`✅ PDF parsed successfully: ${extractedText.length} characters from ${data.numpages} pages`);

    const response: ParsePlanResponse = {
      text: extractedText,
      fileName: file.name,
      pages: data.numpages,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    // Something went wrong (file corrupted, pdf-parse error, etc)
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.error("❌ Parse-plan error:", errorMessage);

    return NextResponse.json(
      {
        error: `Failed to parse PDF: ${errorMessage}`,
        code: "PARSE_ERROR",
      } as ErrorResponse,
      { status: 500 }
    );
  }
}
