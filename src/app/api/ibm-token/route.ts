import { NextResponse } from "next/server";

// Simple in-memory cache — avoids hammering IAM on every widget render
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

export async function GET() {
  const apiKey = process.env.WATSONX_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "WATSONX_API_KEY not set" }, { status: 500 });
  }

  // Return cached token if still valid (refresh 5 min before expiry)
  if (cachedToken && Date.now() < tokenExpiresAt - 5 * 60 * 1000) {
    return NextResponse.json({ token: cachedToken });
  }

  const response = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ibm:params:oauth:grant-type:apikey",
      apikey: apiKey,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json(
      { error: `IAM token fetch failed (${response.status}): ${text}` },
      { status: 502 }
    );
  }

  const data = (await response.json()) as { access_token: string; expires_in: number };
  cachedToken = data.access_token;
  tokenExpiresAt = Date.now() + data.expires_in * 1000;

  return NextResponse.json({ token: cachedToken });
}
