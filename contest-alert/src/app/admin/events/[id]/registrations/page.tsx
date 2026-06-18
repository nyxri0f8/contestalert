"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Users, DownloadSimple } from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/shared/Sidebar";
import { motion } from "framer-motion";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;

export default function RegistrationsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [event, setEvent] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      try {
        const supabase = createClient();
        
        // 1. Get Event
        const { data: dbEvent, error: eventErr } = await supabase
          .from("events")
          .select("*")
          .eq("id", id)
          .single();

        if (eventErr) throw eventErr;
        setEvent(dbEvent);

        // 2. Get Registrations
        const { data: regs, error: regErr } = await supabase
          .from("registrations")
          .select(`
            id,
            ticket_id,
            team_name,
            phone,
            transaction_id,
            form_data,
            registered_at,
            profiles:user_id (
              name,
              register_number,
              department,
              email
            )
          `)
          .eq("event_id", id)
          .order("registered_at", { ascending: false });

        if (regErr) throw regErr;
        setRegistrations(regs || []);
      } catch (err) {
        console.error("Error loading data", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const exportCSV = () => {
    if (!event || registrations.length === 0) return;

    const dynamicHeaders = (event.form_schema || []).map((f: any) => f.label);
    const headers = [
      "Ticket ID", "Transaction ID", "Name", "Reg No", "Department", "Email", "Phone", "Team Name", "Date", ...dynamicHeaders
    ];

    const rows = registrations.map(reg => {
      const p = reg.profiles || {};
      const fd = reg.form_data || {};
      const dynamicFields = (event.form_schema || []).map((f: any) => fd[f.id] || "");
      
      return [
        reg.ticket_id,
        reg.transaction_id || "-",
        p.name || "Unknown",
        p.register_number || "-",
        p.department || "-",
        p.email || "-",
        reg.phone || "-",
        reg.team_name || "-",
        new Date(reg.registered_at).toLocaleString(),
        ...dynamicFields
      ].map(val => \`"\${String(val).replace(/"/g, '""')}"\`).join(",");
    });

    const csvContent = [headers.join(","), ...rows].join("\\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = \`registrations_\${event.title.replace(/\\s+/g, '_')}.csv\`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm">Loading...</div>;
  }

  return (
    <div className="min-h-[100dvh] bg-transparent">
      <Sidebar />
      <main className="lg:ml-[var(--sidebar-width)] min-h-[100dvh] pb-16">
        <header className="sticky top-0 z-20 glass-premium border-b border-[var(--surface-border)] px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
            href="/admin/events"
            className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft weight="light" className="w-4 h-4" /> Back to Manage
          </Link>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-subtle)] hover:bg-[var(--surface-border)] text-xs font-bold rounded-xl transition-all border border-[var(--surface-border)]"
          >
            <DownloadSimple weight="bold" className="w-4 h-4" /> Export CSV
          </button>
        </header>

        <div className="px-6 lg:px-8 py-8 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent)]/10 flex items-center justify-center">
              <Users weight="light" className="w-6 h-6 text-[var(--accent)]" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{event?.title}</h1>
              <p className="text-xs text-[var(--foreground-muted)]">{registrations.length} Registrations</p>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
            className="card-bezel overflow-hidden"
          >
            <div className="card-bezel-inner overflow-x-auto bg-transparent">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="border-b border-[var(--surface-border)] bg-[var(--surface-subtle)] text-[10px] uppercase tracking-wider text-[var(--foreground-secondary)] font-bold">
                    <th className="p-4 rounded-tl-2xl">Participant</th>
                    <th className="p-4">Txn ID</th>
                    <th className="p-4">Reg No</th>
                    <th className="p-4">Dept</th>
                    <th className="p-4">Contact</th>
                    <th className="p-4">Team</th>
                    {(event?.form_schema || []).map((f: any) => (
                      <th key={f.id} className="p-4">{f.label}</th>
                    ))}
                    <th className="p-4 rounded-tr-2xl">Date</th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-[var(--surface-border)]">
                  {registrations.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-[var(--foreground-muted)]">No registrations yet.</td>
                    </tr>
                  ) : (
                    registrations.map(reg => (
                      <tr key={reg.id} className="hover:bg-[var(--surface-subtle)]/50 transition-colors">
                        <td className="p-4">
                          <div className="font-semibold text-[var(--foreground)]">{reg.profiles?.name || "Unknown"}</div>
                          <div className="text-[10px] text-[var(--foreground-muted)]">{reg.ticket_id}</div>
                        </td>
                        <td className="p-4 font-mono text-[var(--cta)]">{reg.transaction_id || "-"}</td>
                        <td className="p-4 font-mono">{reg.profiles?.register_number || "-"}</td>
                        <td className="p-4">{reg.profiles?.department || "-"}</td>
                        <td className="p-4">
                          <div className="text-[11px]">{reg.phone || "-"}</div>
                          <div className="text-[10px] text-[var(--foreground-muted)]">{reg.profiles?.email || "-"}</div>
                        </td>
                        <td className="p-4">
                          {reg.team_name ? (
                            <span className="px-2 py-1 bg-[var(--accent-muted)] text-[var(--accent-text)] rounded text-[10px] font-bold">
                              {reg.team_name}
                            </span>
                          ) : "-"}
                        </td>
                        
                        {(event?.form_schema || []).map((f: any) => (
                          <td key={f.id} className="p-4 text-[var(--foreground-secondary)] whitespace-pre-wrap max-w-[200px] truncate">
                            {reg.form_data?.[f.id] || "-"}
                          </td>
                        ))}

                        <td className="p-4 text-[10px] text-[var(--foreground-muted)]">
                          {new Date(reg.registered_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
