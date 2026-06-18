// Create Test Users for Contest Alert
// Run: node scripts/create-test-users.mjs

const SUPABASE_URL = "https://kmyxcmnyzrimlclszlfw.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtteXhjbW55enJpbWxjbHN6bGZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3ODk1MTgsImV4cCI6MjA5NzM2NTUxOH0.FqT1M9o36eWPQSFirMLIEl2aPS2qBIaPLV5gQTKpfpY";

async function createUser(email, password, metadata) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email,
      password,
      data: metadata,
    }),
  });
  const data = await res.json();
  if (data.error) {
    console.error(`Failed to create ${email}:`, data.error);
  } else {
    console.log(`Created ${email} — ID: ${data.user?.id || data.id}`);
  }
  return data;
}

async function updateProfile(userId, profileData) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Prefer": "return=minimal",
    },
    body: JSON.stringify(profileData),
  });
  if (res.ok) {
    console.log(`  → Profile updated for ${userId}`);
  } else {
    const err = await res.text();
    console.error(`  → Profile update failed:`, err);
  }
}

async function main() {
  console.log("=== Creating Test Admin ===");
  const admin = await createUser("admin@test.com", "admin123456", {
    role: "admin",
    onboarding_completed: true,
  });

  console.log("\n=== Creating Test Student ===");
  const student = await createUser("student@test.com", "student123456", {
    role: "student",
    onboarding_completed: true,
  });

  // Wait a moment for the trigger to create the profile rows
  console.log("\nWaiting 3s for profile triggers...");
  await new Promise(r => setTimeout(r, 3000));

  // Update admin profile
  if (admin.user?.id) {
    await updateProfile(admin.user.id, {
      name: "Test Admin",
      register_number: "ADMIN001",
      department: "CSE",
      role: "admin",
      onboarding_completed: true,
      phone: "+91 9876543210",
    });
  }

  // Update student profile
  if (student.user?.id) {
    await updateProfile(student.user.id, {
      name: "Test Student",
      register_number: "312621104001",
      department: "CSE",
      year: 3,
      section: "A",
      role: "student",
      onboarding_completed: true,
      phone: "+91 9876543211",
    });
  }

  console.log("\n=== Done! ===");
  console.log("Admin login:   admin@test.com / admin123456");
  console.log("Student login: student@test.com / student123456");
  console.log("\nNote: For the student login, switch to 'Admin' mode on the login page and use email/password.");
}

main().catch(console.error);
