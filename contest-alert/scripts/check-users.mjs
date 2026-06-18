// Check if our test users exist but are unconfirmed
const SUPABASE_URL = "https://kmyxcmnyzrimlclszlfw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteXhjbW55enJpbWxjbHN6bGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3ODk1MTgsImV4cCI6MjA5NzM2NTUxOH0.FqT1M9o36eWPQSFirMLIEl2aPS2qBIaPLV5gQTKpfpY";

async function main() {
  // Check if profiles exist for our test emails
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?email=in.("admin@test.com","student@test.com")&select=id,email,name,role,onboarding_completed`, {
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  const data = await res.json();
  console.log("Profiles found:", JSON.stringify(data, null, 2));
}

main().catch(console.error);
