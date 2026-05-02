/**
 * IBM Watsonx Authentication Module
 *
 * This module handles OAuth2 token exchange:
 * 1. Takes your API key (from .env.local)
 * 2. Exchanges it for a temporary token with IBM
 * 3. Caches the token in memory
 * 4. Returns the cached token if still valid (fast)
 * 5. Fetches a new token if expired (automatic)
 *
 * Why? Tokens expire (60 min), making them safer than permanent API keys.
 * Why cache? Each request would be 500ms slower if we fetched a token every time.
 */

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Shape of IBM's token response
 * This is what we get back when we send the API key to IBM's auth server
 */
interface IBMTokenResponse {
  access_token: string; // The temporary token we'll use in requests
  token_type: string; // Always "Bearer" for this API
  expires_in: number; // Seconds until token expires (usually 3600 = 1 hour)
}

// ============================================================================
// CACHING STATE (Module-level variables)
// ============================================================================

/**
 * Cached token from the last successful auth request
 * Stored in memory so we don't have to fetch on every request
 * Reset to null if token expires or if fetch fails
 */
let cachedToken: string | null = null;

/**
 * Time when the cached token expires (milliseconds since epoch)
 * Used to check: "Is the cached token still valid?"
 * Example: cachedExpiry = 1683048345678 (a timestamp in the future)
 *
 * We cache for 55 minutes instead of 60 to give a 5-minute buffer.
 * Why? If the token expires on the server exactly at 60 min, but our
 * clock is slightly off, we might use an expired token. 55 min is safer.
 */
let cachedExpiry: number = 0;

// ============================================================================
// HELPER: Fetch a new token from IBM
// ============================================================================

/**
 * Makes the actual HTTP request to IBM's auth server
 * This is called when:
 *   1. First time getIAMToken() is called (no cached token yet)
 *   2. Cached token has expired
 *
 * Details of the request:
 * - URL: IBM's standard OAuth2 token endpoint
 * - Method: POST
 * - Body: form-encoded with your API key
 * - IBM verifies the API key and returns a temporary token
 */
async function fetchNewTokenFromIBM(): Promise<string> {
  // Read the API key from .env.local (loaded by Next.js at startup)
  const apiKey = process.env.WATSONX_API_KEY;

  // Safety check: API key must be configured
  if (!apiKey) {
    throw new Error(
      "WATSONX_API_KEY is not set in .env.local. " +
        "Check your environment variables."
    );
  }

  // Construct the request body using URLSearchParams (form-encoded format)
  // This is the standard way to send credentials to OAuth2 token endpoints
  const params = new URLSearchParams();
  params.append("grant_type", "urn:ibm:params:oauth:grant-type:apikey");
  params.append("apikey", apiKey);
  params.append("response_type", "cloud_iam");

  // Make the HTTP request to IBM's auth server
  // We're sending: "Here's my API key, please give me a temporary token"
  const response = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: params.toString(),
  });

  // Check if the request succeeded (HTTP 200-299)
  if (!response.ok) {
    // If IBM auth fails, it's usually one of these reasons:
    // - API key is wrong
    // - API key is deleted/revoked in IBM console
    // - IBM's service is temporarily down
    const error = await response.text();
    throw new Error(
      `IBM token request failed (${response.status}): ${error}. ` +
        `Check your WATSONX_API_KEY in .env.local.`
    );
  }

  // Parse the JSON response from IBM
  // This gives us the access_token (and metadata like expiration time)
  const data = (await response.json()) as IBMTokenResponse;

  // Verify IBM gave us what we expected
  if (!data.access_token) {
    throw new Error(
      "IBM auth response missing access_token. " +
        "Response: " +
        JSON.stringify(data)
    );
  }

  // Log success (helpful for debugging)
  console.log(
    `✓ IBM token fetched (expires in ${data.expires_in} seconds)`
  );

  return data.access_token;
}

// ============================================================================
// MAIN EXPORT: Get IAM Token (with caching)
// ============================================================================

/**
 * Get an IBM token, using the cache if possible
 *
 * This is the function your code calls when it needs to call Orchestrate:
 *   const token = await getIAMToken();
 *   // Use token to call Orchestrate API
 *
 * Behavior:
 * 1. First call: fetches token from IBM, caches it, returns it (slow, ~500ms)
 * 2. Subsequent calls (within 55 min): returns cached token (fast, <1ms)
 * 3. After 55 min: cached token expired, fetches new one (slow again, ~500ms)
 *
 * This way, 100 requests per day only makes 2 network requests to IBM
 * (instead of 100), saving ~50 seconds total.
 */
export async function getIAMToken(): Promise<string> {
  // Check: Do we have a cached token AND is it still valid?
  // cachedExpiry is a timestamp in the future. If it's > now, token is valid.
  if (cachedToken && cachedExpiry > Date.now()) {
    // Yes, cached token is still valid. Return it immediately.
    // This path is taken ~99% of the time and is very fast (<1ms)
    return cachedToken;
  }

  // No cached token, or it expired. Fetch a new one from IBM.
  // This is slower (~500ms) but happens rarely (once per hour)
  cachedToken = await fetchNewTokenFromIBM();

  // Calculate when this token will expire
  // Tokens from IBM are valid for 3600 seconds (1 hour)
  // We cache for 3300 seconds (55 minutes) for safety
  cachedExpiry = Date.now() + 55 * 60 * 1000;
  // Date.now() = current time in milliseconds
  // 55 * 60 * 1000 = 3,300,000 milliseconds = 55 minutes
  // So: cachedExpiry = now + 55 minutes

  // Return the newly fetched token
  return cachedToken;
}
