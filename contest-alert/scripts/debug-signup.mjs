// Debug: check what Supabase signUp actually returns
const SUPABASE_URL = "https://kmyxcmnyzrimlclszlfw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteXhjbW55enJpbWxjbHN6bGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3ODk1MTgsImV4cCI6MjA5NzM2NTUxOH0.FqT1M9o36eWPQSFirMLIEl2aPS2qBIaPLV5gQTKpfpY";

async function main() {
  // Try to sign up admin
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email: "admin@test.com",
      password: "admin123456",
      data: { role: "admin", onboarding_completed: true },
    }),
  });
  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Full response:", JSON.stringify(data, null, 2));

  // Now try login to see if it already exists
  console.log("\n--- Trying login ---");
  const loginRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email: "admin@test.com",
      password: "admin123456",
    }),
  });
  const loginData = await loginRes.json();
  console.log("Login status:", loginRes.status);
  console.log("Login response:", JSON.stringify(loginData, null, 2));
}

main().catch(console.error);
