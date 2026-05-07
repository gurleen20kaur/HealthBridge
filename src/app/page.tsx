import { redirect } from "next/navigation";

/**
 * Root page → redirect to dashboard
 * Phase 4 made the dashboard the new home; this keeps the / URL working.
 */
export default function Home() {
  redirect("/dashboard");
}
