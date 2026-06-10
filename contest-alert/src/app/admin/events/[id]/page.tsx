"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  Lightning, CalendarCheck, Ticket, Trophy, Bell, SignOut,
  ArrowLeft, House, Sun, Moon, QrCode, ClipboardText,
  Users, Sparkle, PencilSimple
} from "@phosphor-icons/react";
import { useTheme } from "@/components/shared/ThemeProvider";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE_OUT_EXPO } }
};

const NAV_ITEMS = [
  { label: "Admin Panel", icon: House, href: "/admin" },
  { label: "Manage Events", icon: CalendarCheck, href: "/admin/events", active: true },
  { label: "QR Scanner", icon: QrCode, href: "/admin/scanner" },
  { label: "Registrations", icon: ClipboardText, href: "/admin/registrations" },
  { label: "Winner Board", icon: Trophy, href: "/admin/winners" },
  { label: "Student Mode", icon: Users, href: "/dashboard" },
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
          <span className="font-display font-extrabold text-[13px] tracking-tight block leading-none text-[var(--foreground)]">Admin Portal</span>
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

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("hackathon");
  const [department, setDepartment] = useState("CSE");
  const [date, setDate] = useState("");
  const [venue, setVenue] = useState("");
  const [seats, setSeats] = useState("60");
  const [fee, setFee] = useState("0");
  const [deadline, setDeadline] = useState("");
  const [image, setImage] = useState("");
  const [desc, setDesc] = useState("");
  const [rules, setRules] = useState("");
  const [eligibility, setEligibility] = useState("");
  
  // Coordinator
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("rit_events");
    if (stored) {
      const list = JSON.parse(stored);
      const found = list.find((e: any) => e.id === id);
      if (found) {
        setTitle(found.title);
        setCategory(found.category);
        setDepartment(found.department);
        // Format ISO datetime local string: YYYY-MM-DDTHH:MM
        setDate(found.date ? new Date(found.date).toISOString().slice(0, 16) : "");
        setVenue(found.venue);
        setSeats(String(found.seats));
        setFee(String(found.fee));
        setDeadline(found.deadlinedate ? new Date(found.deadlinedate).toISOString().slice(0, 10) : "");
        setImage(found.image || "");
        setDesc(found.desc || "");
        setRules(found.rules || "");
        setEligibility(found.eligibility || "");
        setContactName(found.contactName || "");
        setContactEmail(found.contactEmail || "");
        setContactPhone(found.contactPhone || "");
      } else {
        setNotFound(true);
      }
    } else {
      setNotFound(true);
    }
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      const stored = localStorage.getItem("rit_events");
      const list = stored ? JSON.parse(stored) : [];
      
      const updated = list.map((e: any) => {
        if (e.id === id) {
          return {
            ...e,
            title,
            category,
            department,
            date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
            venue,
            seats: parseInt(seats),
            deadlinedate: new Date(deadline).toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" }),
            fee: parseInt(fee),
            image,
            desc,
            rules,
            eligibility,
            contactName,
            contactEmail,
            contactPhone
          };
        }
        return e;
      });

      localStorage.setItem("rit_events", JSON.stringify(updated));
      setLoading(false);
      router.push("/admin/events");
    }, 1000);
  };

  if (notFound) {
    return (
      <div className="min-h-[100dvh] bg-[var(--background)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-lg font-bold">Event Not Found</h2>
          <p className="text-xs text-[var(--foreground-muted)]">The event you are attempting to edit does not exist or has been deleted.</p>
          <Link href="/admin/events" className="inline-block px-4 py-2 bg-[var(--surface)] border border-[var(--surface-border)] rounded-xl text-xs font-bold">
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[var(--background)]">
      <Sidebar />
      <main className="lg:ml-[var(--sidebar-width)] min-h-[100dvh] pb-16">
        
        {/* Floating Action Bar */}
        <header className="sticky top-0 z-20 glass border-b border-[var(--surface-border)] px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/admin/events" className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
            <ArrowLeft weight="bold" className="w-4.5 h-4.5" /> Back to Manage
          </Link>
          <span className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider">Modify Published Event</span>
        </header>

        {/* Content Form */}
        <div className="px-6 lg:px-8 py-8 max-w-3xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="card-bezel">
            <form onSubmit={handleSubmit} className="card-bezel-inner p-6 sm:p-8 space-y-6">
              
              <div className="flex items-center gap-2 border-b border-[var(--surface-border)] pb-3">
                <PencilSimple className="text-[var(--accent)] w-6 h-6 shrink-0" />
                <div>
                  <h2 className="text-base font-bold">Edit Campus Event Details</h2>
                  <p className="text-[10px] text-[var(--foreground-muted)]">Modifies current parameters. Registered students will see updates instantly.</p>
                </div>
              </div>

              {/* Event title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Event Title</label>
                <input 
                  type="text" required placeholder="e.g. CodeStorm Hackathon 2026"
                  value={title} onChange={e => setTitle(e.target.value)}
                  className="w-full p-3 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" 
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full p-3 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
                    <option value="hackathon">Hackathon</option>
                    <option value="workshop">Workshop</option>
                    <option value="symposium">Symposium</option>
                    <option value="placement">Placement Prep</option>
                    <option value="technical">Technical Contest</option>
                    <option value="non_technical">Non-Technical Event</option>
                    <option value="cultural">Cultural Festival</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Organizing Department</label>
                  <select value={department} onChange={e => setDepartment(e.target.value)}
                    className="w-full p-3 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]">
                    <option value="CSE">Computer Science (CSE)</option>
                    <option value="ECE">Electronics (ECE)</option>
                    <option value="AIML">Artificial Intelligence (AIML)</option>
                    <option value="AIDS">Data Science (AIDS)</option>
                    <option value="Biotechnology">Biotechnology (BT)</option>
                    <option value="Mechanical">Mechanical (ME)</option>
                    <option value="All">All Departments / General</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Event Date & Time</label>
                  <input 
                    type="datetime-local" required
                    value={date} onChange={e => setDate(e.target.value)}
                    className="w-full p-3 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Registration Deadline</label>
                  <input 
                    type="date" required
                    value={deadline} onChange={e => setDeadline(e.target.value)}
                    className="w-full p-3 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Venue</label>
                  <input 
                    type="text" required placeholder="e.g. Main Auditorium"
                    value={venue} onChange={e => setVenue(e.target.value)}
                    className="w-full p-3 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Seat Capacity</label>
                  <input 
                    type="number" required placeholder="60"
                    value={seats} onChange={e => setSeats(e.target.value)}
                    className="w-full p-3 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" 
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Registration Fee (₹)</label>
                  <input 
                    type="number" required placeholder="0 for Free"
                    value={fee} onChange={e => setFee(e.target.value)}
                    className="w-full p-3 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" 
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Cover Image URL</label>
                <input 
                  type="url" required
                  value={image} onChange={e => setImage(e.target.value)}
                  className="w-full p-3 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" 
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Description</label>
                <textarea 
                  rows={4} required placeholder="Detailed information regarding the event, schedule, outline..."
                  value={desc} onChange={e => setDesc(e.target.value)}
                  className="w-full p-3 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>

              {/* Rules & Eligibility */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Rules (One per line)</label>
                  <textarea 
                    rows={4} placeholder="1. Team size: 2-4&#10;2. Bring laptops"
                    value={rules} onChange={e => setRules(e.target.value)}
                    className="w-full p-3 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Eligibility</label>
                  <textarea 
                    rows={4} placeholder="Open to CSE, IT, ECE engineering streams."
                    value={eligibility} onChange={e => setEligibility(e.target.value)}
                    className="w-full p-3 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                </div>
              </div>

              {/* Coordinator Details */}
              <div className="border-t border-[var(--surface-border)] pt-4 space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)]">Faculty Coordinator Details</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Full Name</label>
                    <input 
                      type="text" placeholder="Dr. A. Ramesh"
                      value={contactName} onChange={e => setContactName(e.target.value)}
                      className="w-full p-3 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--foreground-secondary)]">College Email</label>
                    <input 
                      type="email" placeholder="ramesh@rit.edu"
                      value={contactEmail} onChange={e => setContactEmail(e.target.value)}
                      className="w-full p-3 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" 
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Contact Phone</label>
                    <input 
                      type="tel" placeholder="+91 98401 23456"
                      value={contactPhone} onChange={e => setContactPhone(e.target.value)}
                      className="w-full p-3 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]" 
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-[var(--surface-border)]">
                <Link href="/admin/events" className="px-5 py-3 rounded-xl border border-[var(--surface-border)] hover:bg-[var(--surface-subtle)] text-xs font-bold transition-all">
                  Cancel
                </Link>
                <button 
                  type="submit" disabled={loading}
                  className="px-6 py-3 bg-[var(--cta)] hover:bg-[var(--cta-hover)] text-white text-xs font-bold rounded-xl transition-all shadow-[var(--shadow-cta-glow)] flex items-center justify-center"
                >
                  {loading ? "Saving changes..." : "Save Changes"}
                </button>
              </div>

            </form>
          </motion.div>
        </div>

      </main>
    </div>
  );
}
