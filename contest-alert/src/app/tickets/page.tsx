"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Ticket, CalendarBlank, MapPin, DownloadSimple, Lightning,
  House, Trophy, Medal, Bell, Sun, Moon, SignOut, Info,
  CheckCircle, ArrowRight
} from "@phosphor-icons/react";
import { useTheme } from "@/components/shared/ThemeProvider";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT_EXPO } }
};

interface TicketType {
  id: string;
  eventId: string;
  title: string;
  date: string;
  venue: string;
  teamName: string | null;
  registeredAt: string;
}

const DEFAULT_TICKETS: TicketType[] = [
  {
    id: "EVT-2026-784912",
    eventId: "1",
    title: "CodeStorm Hackathon 2026",
    date: "Jun 28, 2026",
    venue: "Main Auditorium",
    teamName: "CyberKnights",
    registeredAt: "Jun 09, 2026"
  },
  {
    id: "EVT-2026-104928",
    eventId: "2",
    title: "AI Workshop: Transformers",
    date: "Jul 05, 2026",
    venue: "Lab Block C-301",
    teamName: null,
    registeredAt: "Jun 09, 2026"
  }
];

const NAV_ITEMS = [
  { label: "Dashboard", icon: House, href: "/dashboard" },
  { label: "Events", icon: CalendarBlank, href: "/events" },
  { label: "My Tickets", icon: Ticket, href: "/tickets", active: true },
  { label: "Leaderboard", icon: Trophy, href: "/leaderboard" },
  { label: "Achievements", icon: Medal, href: "/achievements" },
  { label: "Notifications", icon: Bell, href: "/notifications", badge: 3 },
];

function Sidebar() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[var(--sidebar-width)] bg-[var(--surface)] border-r border-[var(--surface-border)] flex flex-col z-30 hidden lg:flex">
      <div className="px-6 py-5 border-b border-[var(--surface-border)]">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="bg-white px-2 py-1 rounded-lg border border-neutral-100 shadow-sm flex items-center justify-center shrink-0">
            <img src="/images/logo.png" alt="RIT Logo" className="h-6 w-auto object-contain" />
          </div>
          <span className="text-[var(--surface-border)] font-normal">|</span>
          <span className="font-display font-extrabold text-[13px] tracking-tight block leading-none text-[var(--foreground)]">Contest Alert</span>
        </Link>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <Link key={item.label} href={item.href}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-300 ${
              item.active ? "bg-[var(--accent-muted)] text-[var(--accent-text)]" : "text-[var(--foreground-secondary)] hover:text-[var(--foreground)] hover:bg-[var(--surface-subtle)]"
            }`}>
            <item.icon weight={item.active ? "duotone" : "regular"} className="w-[18px] h-[18px]" />
            <span className="flex-1">{item.label}</span>
            {item.badge && <span className="w-5 h-5 rounded-full bg-[var(--cta)] text-white text-[10px] font-bold flex items-center justify-center">{item.badge}</span>}
          </Link>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-[var(--surface-border)] space-y-1">
        <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-medium text-[var(--foreground-secondary)] hover:bg-[var(--surface-subtle)] transition-all duration-300">
          {resolvedTheme === "dark" ? <Sun weight="regular" className="w-[18px] h-[18px]" /> : <Moon weight="regular" className="w-[18px] h-[18px]" />}
          <span>{resolvedTheme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>
      </div>
    </aside>
  );
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [qrUrls, setQrUrls] = useState<Record<string, string>>({});
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    // Sync tickets from localStorage, fallback to DEFAULT_TICKETS
    const storedTickets = localStorage.getItem("rit_tickets");
    let currentTickets: TicketType[] = [];
    if (storedTickets) {
      currentTickets = JSON.parse(storedTickets);
    } else {
      currentTickets = DEFAULT_TICKETS;
      localStorage.setItem("rit_tickets", JSON.stringify(DEFAULT_TICKETS));
    }
    setTickets(currentTickets);

    // Generate QR Code URLs for all tickets
    currentTickets.forEach(async (t) => {
      try {
        const url = await QRCode.toDataURL(t.id, { margin: 1, width: 250 });
        setQrUrls(prev => ({ ...prev, [t.id]: url }));
      } catch (err) {
        console.error("Failed to generate QR Code", err);
      }
    });
  }, []);

  const downloadPDF = async (ticket: TicketType) => {
    setDownloading(ticket.id);
    try {
      const qrDataUrl = qrUrls[ticket.id] || await QRCode.toDataURL(ticket.id, { margin: 1, width: 250 });

      // Create PDF
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a6" // Small pocket ticket size
      });

      // RIT Branded styling
      doc.setFillColor(48, 56, 65); // Charcoal / Dark background for header
      doc.rect(0, 0, 105, 30, "F");

      // Header Text
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("CONTEST ALERT", 10, 12);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(118, 171, 174); // Teal accent
      doc.text("RAJALAKSHMI INSTITUTE OF TECHNOLOGY", 10, 17);

      // Ticket ID
      doc.setTextColor(255, 87, 34); // Red/Orange CTA color for ticket ID
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(ticket.id, 10, 24);

      // Body Content
      doc.setTextColor(48, 56, 65);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text(doc.splitTextToSize(ticket.title, 85), 10, 42);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("DATE & TIME", 10, 56);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(48, 56, 65);
      doc.text(ticket.date, 10, 60);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text("VENUE", 10, 68);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(48, 56, 65);
      doc.text(ticket.venue, 10, 72);

      if (ticket.teamName) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 100, 100);
        doc.text("TEAM NAME", 10, 80);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(48, 56, 65);
        doc.text(ticket.teamName, 10, 84);
      }

      // Add QR Code
      doc.addImage(qrDataUrl, "PNG", 32, 95, 40, 40);

      // Bottom footer info
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6);
      doc.setTextColor(150, 150, 150);
      doc.text("Scan at the venue entrance to mark attendance.", 30, 142);

      // Save PDF
      doc.save(`Ticket-${ticket.id}.pdf`);
    } catch (err) {
      console.error(err);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[var(--background)]">
      <Sidebar />
      <main className="lg:ml-[var(--sidebar-width)] min-h-[100dvh] pb-12">
        
        {/* Header */}
        <header className="sticky top-0 z-20 glass border-b border-[var(--surface-border)] px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">My Tickets</h1>
            <p className="text-xs text-[var(--foreground-muted)]">Scan tickets at event venues to mark attendance</p>
          </div>
        </header>

        {/* Tickets Layout */}
        <div className="px-6 lg:px-8 py-8 max-w-4xl mx-auto space-y-6">
          {tickets.length > 0 ? (
            tickets.map((t, idx) => (
              <motion.div 
                key={t.id}
                variants={fadeUp}
                initial="hidden"
                animate="visible"
                transition={{ delay: idx * 0.05 }}
                className="card-bezel overflow-hidden group"
              >
                <div className="card-bezel-inner flex flex-col md:flex-row bg-[var(--surface-subtle)] hover:bg-[var(--surface-subtle)]/80 transition-colors duration-200">
                  
                  {/* Left Column: Ticket Info */}
                  <div className="flex-1 p-6 sm:p-8 space-y-6 border-b md:border-b-0 md:border-r border-dashed border-[var(--surface-border)] relative">
                    {/* Semi-circle notch overlays on border (boarding pass style) */}
                    <div className="absolute right-[-8px] top-[-8px] w-4 h-4 rounded-full bg-[var(--background)] hidden md:block border-b border-[var(--surface-border)]" />
                    <div className="absolute right-[-8px] bottom-[-8px] w-4 h-4 rounded-full bg-[var(--background)] hidden md:block border-t border-[var(--surface-border)]" />

                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <span className="inline-flex px-2 py-0.5 rounded bg-[var(--accent-muted)] text-[var(--accent-text)] text-[9px] font-bold uppercase tracking-wider">
                          Entry Pass
                        </span>
                        <h2 className="text-base sm:text-lg font-bold tracking-tight text-[var(--foreground)]">
                          {t.title}
                        </h2>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono text-xs font-semibold text-[var(--cta)] block">
                          {t.id}
                        </span>
                        <span className="text-[10px] text-[var(--foreground-muted)]">
                          Registered: {t.registeredAt}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-[var(--surface-border)] pt-4">
                      <div>
                        <span className="text-[10px] text-[var(--foreground-muted)] font-semibold uppercase tracking-wider block">
                          Date & Time
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <CalendarBlank className="w-4 h-4 text-[var(--accent)] shrink-0" />
                          <span className="text-xs font-semibold text-[var(--foreground-secondary)]">
                            {t.date}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-[var(--foreground-muted)] font-semibold uppercase tracking-wider block">
                          Venue
                        </span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <MapPin className="w-4 h-4 text-[var(--accent)] shrink-0" />
                          <span className="text-xs font-semibold text-[var(--foreground-secondary)] truncate max-w-[120px]">
                            {t.venue}
                          </span>
                        </div>
                      </div>

                      {t.teamName && (
                        <div className="col-span-2">
                          <span className="text-[10px] text-[var(--foreground-muted)] font-semibold uppercase tracking-wider block">
                            Team Name
                          </span>
                          <span className="text-xs font-bold text-[var(--foreground-secondary)] mt-1 block">
                            {t.teamName}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: QR Code + Download Button */}
                  <div className="w-full md:w-[220px] p-6 sm:p-8 flex flex-col items-center justify-center bg-[var(--surface)] shrink-0 gap-4">
                    {qrUrls[t.id] ? (
                      <div className="p-2.5 bg-white rounded-xl border border-neutral-200">
                        <img 
                          src={qrUrls[t.id]} 
                          alt="Ticket QR Code"
                          className="w-32 h-32 select-none pointer-events-none" 
                        />
                      </div>
                    ) : (
                      <div className="w-32 h-32 bg-neutral-200 animate-pulse rounded-xl" />
                    )}

                    <button
                      onClick={() => downloadPDF(t)}
                      disabled={downloading === t.id}
                      className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold bg-[var(--accent)] hover:bg-[var(--accent-hover)] transition-all shadow-[var(--shadow-accent-glow)] text-black"
                    >
                      <DownloadSimple weight="bold" className="w-4 h-4" />
                      {downloading === t.id ? "Downloading..." : "Download PDF"}
                    </button>
                  </div>

                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center py-20 card-bezel">
              <div className="card-bezel-inner p-10 space-y-4">
                <Ticket weight="duotone" className="w-12 h-12 text-[var(--foreground-muted)] mx-auto" />
                <h2 className="text-base font-bold">No tickets generated yet</h2>
                <p className="text-xs text-[var(--foreground-muted)] max-w-sm mx-auto">
                  Browse events and register to receive your entry tickets and earn department leaderboard points.
                </p>
                <Link href="/events" className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--cta)] hover:bg-[var(--cta-hover)] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-[var(--shadow-cta-glow)]">
                  Explore Events <ArrowRight weight="bold" className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}
