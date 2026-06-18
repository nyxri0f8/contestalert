import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// To ensure it can run on Vercel Edge or Serverless securely
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
    // We use service role to bypass RLS in the cron job
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    // Fallback to anon key if service key not available (not recommended for production)
    const supabase = createClient(supabaseUrl, supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(now.getMonth() - 3);

    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(now.getMonth() - 6);

    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(now.getDate() + 7);

    // 1. Fetch all relevant events
    const { data: events, error } = await supabase.from("events").select("*");

    if (error || !events) {
      throw new Error("Failed to fetch events: " + (error?.message || ""));
    }

    let deletedImagesCount = 0;
    let archivedEventsCount = 0;
    let deletedEventsCount = 0;
    let needsBackupNames: string[] = [];

    for (const event of events) {
      const eventDate = new Date(event.created_at);
      const deadline = new Date(event.deadline);

      // --- A. 6-Month Permanent Deletion ---
      if (eventDate < sixMonthsAgo) {
        // Delete event from DB
        await supabase.from("events").delete().eq("id", event.id);
        
        // Also delete cover image and payment QR from storage if exists
        if (event.cover_image_path) {
          await supabase.storage.from("event-covers").remove([event.cover_image_path]);
        }
        if (event.payment_qr_path) {
          await supabase.storage.from("payment-qrs").remove([event.payment_qr_path]);
        }
        deletedEventsCount++;
        continue; // Event is gone, skip other checks
      }

      // --- B. 3-Month Event Archiving ---
      if (eventDate < threeMonthsAgo && event.status !== "archived") {
        await supabase.from("events").update({ status: "archived", archived_at: new Date().toISOString() }).eq("id", event.id);
        archivedEventsCount++;
      }

      // --- C. Image Auto-Delete after Deadline ---
      if (deadline < now) {
        let hasDeleted = false;
        
        if (event.cover_image_path) {
          const { error: storageErr } = await supabase.storage.from("event-covers").remove([event.cover_image_path]);
          if (!storageErr) {
            await supabase.from("events").update({ cover_image_path: null }).eq("id", event.id);
            console.log(`[CRON] Deleted cover image for event: ${event.title}`);
            hasDeleted = true;
          }
        }
        
        if (event.payment_qr_path) {
          const { error: storageErr } = await supabase.storage.from("payment-qrs").remove([event.payment_qr_path]);
          if (!storageErr) {
            await supabase.from("events").update({ payment_qr_path: null }).eq("id", event.id);
            console.log(`[CRON] Deleted payment QR for event: ${event.title}`);
            hasDeleted = true;
          }
        }
        
        if (hasDeleted) deletedImagesCount++;
      }

      // --- D. Backup Warning Checks (Deadline within 7 days, not backed up) ---
      if (event.status === "active" && !event.is_backed_up && deadline <= sevenDaysFromNow && deadline >= now) {
        needsBackupNames.push(event.title);
      }
    }

    // --- E. Send Email if there are impending backups needed ---
    if (needsBackupNames.length > 0 && process.env.RESEND_API_KEY) {
      try {
        await resend.emails.send({
          from: "Contest Alert <onboarding@resend.dev>", // Change verified domain in prod
          to: "contestalertrit@gmail.com",
          subject: `⚠️ Action Required: ${needsBackupNames.length} Events Need Backup`,
          html: `<p>Hello Admin,</p>
                 <p>The following events are approaching their deadline within 7 days and have not been backed up yet:</p>
                 <ul>
                   ${needsBackupNames.map(n => `<li>${n}</li>`).join('')}
                 </ul>
                 <p>Please log in to the admin dashboard to generate and download the XLSX backup.</p>
                 <br/><p>Contest Alert System</p>`,
        });
        console.log(`[CRON] Sent backup warning email to admin for ${needsBackupNames.length} events.`);
      } catch (emailErr) {
        console.error("[CRON] Failed to send email via Resend:", emailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Cron executed successfully",
      stats: {
        deletedImages: deletedImagesCount,
        archivedEvents: archivedEventsCount,
        deletedEvents: deletedEventsCount,
        backupWarningsSent: needsBackupNames.length
      }
    });

  } catch (error: any) {
    console.error("[CRON] Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
