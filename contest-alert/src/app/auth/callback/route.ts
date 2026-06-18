import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  let next = searchParams.get("next") ?? "/dashboard";
  
  // Prevent open redirect by ensuring next path is internal
  if (!next.startsWith("/") || next.startsWith("//")) {
    next = "/dashboard";
  }

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Check if this is the admin account and promote them
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.email === 'contestalertrit@gmail.com') {
        const currentRole = user.user_metadata?.role;
        if (currentRole !== 'admin') {
          // Update auth metadata
          await supabase.auth.updateUser({
            data: { role: 'admin' }
          });
          // Update public.profiles table
          await supabase.from('profiles').update({ role: 'admin' }).eq('id', user.id);
        }
      }

      const forwardedHost = request.headers.get("x-forwarded-host");
      const isLocalEnv = process.env.NODE_ENV === "development";
      
      let redirectPath = next;
      if (user && user.email === 'contestalertrit@gmail.com') {
        redirectPath = "/admin";
      }

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${redirectPath}`);
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${redirectPath}`);
      } else {
        return NextResponse.redirect(`${origin}${redirectPath}`);
      }
    }
  }

  // Return to login on error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
