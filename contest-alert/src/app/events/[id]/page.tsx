"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Clock, MapPin, Users, Phone, EnvelopeSimple, Info,
  BookOpen, ArrowLeft, Ticket, CheckCircle, Warning,
  Lightning, House, CalendarBlank, Trophy, Medal, Bell,
  Sun, Moon, SignOut, User, ShareNetwork, CurrencyInr
} from "@phosphor-icons/react";
import { useTheme } from "@/components/shared/ThemeProvider";
import { createClient } from "@/lib/supabase/client";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
};

const MOCK_EVENTS = [
  { id: "1", title: "CodeStorm Hackathon 2026", category: "hackathon", department: "CSE", date: "Jun 28, 2026", time: "09:00 AM - 05:00 PM (48 Hours)", venue: "Main Auditorium", seats: 42, total: 120, deadline: "safe", deadlinedate: "Jun 25, 2026", fee: 150, contactName: "Dr. A. Ramesh", contactEmail: "ramesh.cse@rit.edu", contactPhone: "+91 98401 23456", image: "https://picsum.photos/seed/hack2026/1200/600", desc: "CodeStorm is the annual flagship 48-hour coding hackathon organized by the Department of Computer Science & Engineering at RIT Chennai. Bring your revolutionary ideas to life! Over two days of pure creation, you'll brainstorm, design, and code solutions to modern engineering and societal challenges. Industry leaders and technical architects will serve as mentors to help teams refine their products.", rules: "1. Team size: 2 to 4 members.\n2. Open to all engineering streams.\n3. Bring your own laptops and development kits.\n4. Use of open-source frameworks is permitted, but template projects will lead to immediate disqualification.\n5. Intellectual property of the built products remains with the teams.", eligibility: "Pre-final and Final year B.E/B.Tech students of any recognized institution." },
  { id: "2", title: "AI Workshop: Transformers & Beyond", category: "workshop", department: "AIML", date: "Jul 5, 2026", time: "10:00 AM - 04:00 PM", venue: "Lab Block C-301", seats: 18, total: 60, deadline: "warn", deadlinedate: "Jul 2, 2026", fee: 0, contactName: "Mrs. S. Priya", contactEmail: "priya.aiml@rit.edu", contactPhone: "+91 97890 12345", image: "https://picsum.photos/seed/aiwork/1200/600", desc: "Dive deep into modern natural language processing and computer vision paradigms. This intensive hand-on workshop starts from basic attention mechanisms and goes all the way to fine-tuning large vision-language transformers. Attendees will write and execute PyTorch scripts to customize pre-trained transformer backbones.", rules: "1. Standard prerequisite: basic Python and PyTorch understanding.\n2. Google Colab Pro accounts will be provided for GPUs.\n3. 100% attendance required for completion certificate.", eligibility: "B.E/B.Tech students from CSE, IT, AIML, AIDS, and ECE branches." },
  { id: "3", title: "Placement Prep Bootcamp", category: "placement", department: "All", date: "Jul 12, 2026", time: "08:30 AM - 04:30 PM (3 Days)", venue: "Seminar Hall A", seats: 120, total: 200, deadline: "safe", deadlinedate: "Jul 10, 2026", fee: 0, contactName: "Mr. K. Selvam", contactEmail: "selvam.placement@rit.edu", contactPhone: "+91 94440 98765", image: "https://picsum.photos/seed/place2026/1200/600", desc: "Gain an edge in your dream campus placements. This bootcamp is designed to prep you for Tier-1 and product-based companies. It covers intensive mock aptitude assessments, mock interviews, data structures & algorithms problem solving, and personalized resume feedback from HR professionals.", rules: "1. Mandatory attendance in formal attire.\n2. Bring printed copies of resumes.\n3. Timely completion of daily assignments is required to receive the badge.", eligibility: "Strictly for final year (Class of 2027) BE/B.Tech/MCA students." },
  { id: "4", title: "RoboWars Championship", category: "technical", department: "ECE", date: "Jun 22, 2026", time: "10:00 AM onwards", venue: "Open Ground Arena", seats: 6, total: 30, deadline: "critical", deadlinedate: "Jun 21, 2026", fee: 300, contactName: "Dr. M. Vinoth", contactEmail: "vinoth.ece@rit.edu", contactPhone: "+91 99620 54321", image: "https://picsum.photos/seed/robo2026/1200/600", desc: "Enter the battlefield where metal meets metal! Organize your team, construct your combat robot under the specified weight classes, and test your engineering limits in our customized steel arena. Features dual-active weapon systems, pneumatic flippers, and spinning drums. Cash prizes worth ₹50,000 to be won.", rules: "1. Robot weight class: up to 15 kg.\n2. Wired or wireless RF control allowed.\n3. No IC engines or chemical explosives.\n4. Complete safety check prior to arena entry is mandatory.", eligibility: "Open to all departments and all institutions nationwide." },
  { id: "5", title: "Cultural Fest: Rhythms 2026", category: "cultural", department: "All", date: "Aug 2, 2026", time: "09:00 AM - 09:00 PM", venue: "OAT (Open Air Theatre)", seats: 500, total: 500, deadline: "safe", deadlinedate: "Jul 30, 2026", fee: 50, contactName: "Dr. Geetha S.", contactEmail: "geetha.s@rit.edu", contactPhone: "+91 98411 98411", image: "https://picsum.photos/seed/cultural2026/1200/600", desc: "The grandest annual cultural festival of Rajalakshmi Institute of Technology. Features dance battles, battle of bands, musical acts, stand-up comedy, street plays, and art galleries. An evening filled with expression, color, rhythm, and memories.", rules: "1. Registrations must close before the deadline.\n2. Respect guidelines for general campus conduct.\n3. Ticket scanning at outer gate starts at 8:00 AM.", eligibility: "All students, faculty, and alumni are welcome to attend." },
  { id: "6", title: "Biotech Symposium", category: "symposium", department: "Biotechnology", date: "Jul 20, 2026", time: "09:30 AM - 04:30 PM", venue: "Seminar Hall B", seats: 45, total: 80, deadline: "warn", deadlinedate: "Jul 17, 2026", fee: 100, contactName: "Dr. K. Shalini", contactEmail: "shalini.bt@rit.edu", contactPhone: "+91 91234 56789", image: "https://picsum.photos/seed/biotech2026/1200/600", desc: "The National Symposium on Applied Biotechnology is a platform for scholars, researchers, and students to discuss computational biology, genetic engineering advances, and bioinformatics. Includes technical paper presentations and poster galleries.", rules: "1. Abstract submission for papers must be sent to contact email.\n2. Maximum 2 authors per paper.\n3. Soft copy of presentation slides must be loaded by 9:00 AM on the event day.", eligibility: "Students and research scholars in life sciences and allied fields." }
];

const NAV_ITEMS = [
  { label: "Dashboard", icon: House, href: "/dashboard" },
  { label: "Events", icon: CalendarBlank, href: "/events", active: true },
  { label: "My Tickets", icon: Ticket, href: "/tickets" },
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

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [event, setEvent] = useState<typeof MOCK_EVENTS[0] | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [phone, setPhone] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const found = MOCK_EVENTS.find(e => e.id === id);
    if (found) {
      setEvent(found);
      // Check if already marked registered in localStorage
      const userRegs = JSON.parse(localStorage.getItem("rit_registered_events") || "[]");
      setIsRegistered(userRegs.includes(found.id));
    }
  }, [id]);

  if (!event) {
    return (
      <div className="min-h-[100dvh] bg-[var(--background)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-[var(--foreground-secondary)] text-sm">Loading event details...</p>
          <button onClick={() => router.push("/events")} className="px-4 py-2 bg-[var(--surface)] text-[var(--foreground)] border border-[var(--surface-border)] rounded-xl text-sm hover:bg-[var(--surface-subtle)] transition-colors">
            Go Back to Events
          </button>
        </div>
      </div>
    );
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);

    // Simulate API call
    setTimeout(() => {
      setRegistering(false);
      setIsRegistered(true);
      setShowForm(false);
      
      // Store in localStorage
      const userRegs = JSON.parse(localStorage.getItem("rit_registered_events") || "[]");
      userRegs.push(event.id);
      localStorage.setItem("rit_registered_events", JSON.stringify(userRegs));

      // Also create a ticket entry
      const tickets = JSON.parse(localStorage.getItem("rit_tickets") || "[]");
      const randomTicketId = `EVT-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      tickets.push({
        id: randomTicketId,
        eventId: event.id,
        title: event.title,
        date: event.date,
        venue: event.venue,
        teamName: teamName || null,
        registeredAt: new Date().toLocaleDateString()
      });
      localStorage.setItem("rit_tickets", JSON.stringify(tickets));

      // Notification
      const notes = JSON.parse(localStorage.getItem("rit_notifications") || "[]");
      notes.unshift({
        id: Math.random().toString(),
        title: "Registration Success",
        message: `You registered successfully for ${event.title}!`,
        type: "registration_success",
        date: "Just Now",
        read: false
      });
      localStorage.setItem("rit_notifications", JSON.stringify(notes));

    }, 1200);
  };

  const deadlineStyle = {
    safe: "text-[#4CAF50] bg-[#4CAF50]/10 border-[#4CAF50]/20",
    warn: "text-[#FF9800] bg-[#FF9800]/10 border-[#FF9800]/20",
    urgent: "text-[#FF5722] bg-[#FF5722]/10 border-[#FF5722]/20",
    critical: "text-[#D32F2F] bg-[#D32F2F]/10 border-[#D32F2F]/20 animate-pulse"
  }[event.deadline];

  return (
    <div className="min-h-[100dvh] bg-[var(--background)]">
      <Sidebar />
      <main className="lg:ml-[var(--sidebar-width)] min-h-[100dvh] pb-16">
        
        {/* Top Floating Action Bar */}
        <header className="sticky top-0 z-20 glass border-b border-[var(--surface-border)] px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/events" className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
            <ArrowLeft weight="bold" className="w-4.5 h-4.5" /> Back to Events
          </Link>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Link copied to clipboard!");
              }}
              className="w-9 h-9 rounded-xl border border-[var(--surface-border)] hover:bg-[var(--surface-subtle)] flex items-center justify-center text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
              title="Share Event"
            >
              <ShareNetwork weight="bold" className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="px-6 lg:px-8 py-8 space-y-8 max-w-6xl mx-auto">
          {/* Cover Hero Banner */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }} 
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            className="relative h-[250px] sm:h-[380px] rounded-2xl overflow-hidden card-bezel"
          >
            <div className="card-bezel-inner relative h-full">
              <div 
                className="absolute inset-0 bg-cover bg-center" 
                style={{ backgroundImage: `url(${event.image})` }} 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
              
              {/* Badge Overlays */}
              <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-4">
                <div className="space-y-2 max-w-2xl text-white">
                  <span className="inline-flex px-3 py-1 rounded-full bg-[var(--accent)] text-black text-[10px] font-bold uppercase tracking-wider">
                    {event.category}
                  </span>
                  <h1 className="text-xl sm:text-3xl font-display font-extrabold tracking-tight leading-tight drop-shadow-md">
                    {event.title}
                  </h1>
                  <p className="text-xs text-white/80 font-medium">
                    Organized by Department of {event.department}
                  </p>
                </div>
                
                <div className="shrink-0 flex items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${deadlineStyle}`}>
                    Deadline: {event.deadlinedate}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Details Bento Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left Column: Description, Rules & Info (2 cols) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Description */}
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="card-bezel">
                <div className="card-bezel-inner p-6 space-y-4">
                  <div className="flex items-center gap-2 border-b border-[var(--surface-border)] pb-3">
                    <Info weight="duotone" className="w-5 h-5 text-[var(--accent)]" />
                    <h3 className="text-base font-semibold">About the Event</h3>
                  </div>
                  <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed whitespace-pre-line">
                    {event.desc}
                  </p>
                </div>
              </motion.div>

              {/* Rules & Guidelines */}
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="card-bezel">
                <div className="card-bezel-inner p-6 space-y-4">
                  <div className="flex items-center gap-2 border-b border-[var(--surface-border)] pb-3">
                    <BookOpen weight="duotone" className="w-5 h-5 text-[var(--cta)]" />
                    <h3 className="text-base font-semibold">Rules & Regulations</h3>
                  </div>
                  <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed whitespace-pre-line font-mono text-[13px] bg-[var(--surface-subtle)] p-4 rounded-xl border border-[var(--surface-border)]">
                    {event.rules}
                  </p>
                </div>
              </motion.div>

              {/* Eligibility */}
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="card-bezel">
                <div className="card-bezel-inner p-6 space-y-4">
                  <div className="flex items-center gap-2 border-b border-[var(--surface-border)] pb-3">
                    <Users weight="duotone" className="w-5 h-5 text-[var(--accent)]" />
                    <h3 className="text-base font-semibold">Eligibility</h3>
                  </div>
                  <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">
                    {event.eligibility}
                  </p>
                </div>
              </motion.div>

            </div>

            {/* Right Column: Dynamic Action Card & Metadata (1 col) */}
            <div className="space-y-6">
              
              {/* Registration / Ticket Info Card */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }}
                className="card-bezel"
              >
                <div className="card-bezel-inner p-6 space-y-6 bg-[var(--surface-subtle)]">
                  <div className="space-y-1">
                    <div className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider font-semibold">Registration Fee</div>
                    <div className="text-3xl font-display font-extrabold text-[var(--foreground)] flex items-center gap-1">
                      {event.fee === 0 ? "FREE" : (
                        <>
                          <CurrencyInr weight="bold" className="w-6 h-6 text-[var(--accent)]" />
                          <span>{event.fee}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Seat availability tracker */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-[var(--foreground-secondary)]">Seats Remaining</span>
                      <span className="font-mono text-[var(--accent)] font-bold">{event.seats} / {event.total}</span>
                    </div>
                    <div className="h-2 bg-[var(--surface-border)] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[var(--accent)] transition-all duration-500" 
                        style={{ width: `${(event.seats / event.total) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Dynamic Interactive Button */}
                  {isRegistered ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 p-3 bg-[var(--accent-muted)] border border-[var(--accent)]/30 text-[var(--accent-text)] rounded-xl text-xs font-bold uppercase tracking-wider">
                        <CheckCircle weight="fill" className="w-4 h-4" /> Registered Successfully
                      </div>
                      <Link href="/tickets" className="w-full flex items-center justify-center gap-2 p-3 bg-[var(--surface)] hover:bg-[var(--surface-border)] border border-[var(--surface-border)] text-sm font-semibold rounded-xl text-[var(--foreground)] transition-colors">
                        <Ticket weight="bold" className="w-4.5 h-4.5" /> View Ticket
                      </Link>
                    </div>
                  ) : showForm ? (
                    <form onSubmit={handleRegister} className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Team Name (Optional)</label>
                        <input 
                          type="text" placeholder="e.g. CyberKnights" 
                          value={teamName} onChange={e => setTeamName(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Contact Phone (Required)</label>
                        <input 
                          type="tel" placeholder="e.g. 9876543210" required 
                          value={phone} onChange={e => setPhone(e.target.value)}
                          className="w-full p-2.5 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                        />
                      </div>
                      <div className="flex gap-2 pt-2">
                        <button 
                          type="button" onClick={() => setShowForm(false)}
                          className="flex-1 py-2.5 rounded-xl border border-[var(--surface-border)] hover:bg-[var(--surface)] text-xs font-bold transition-all"
                        >
                          Cancel
                        </button>
                        <button 
                          type="submit" disabled={registering}
                          className="flex-1 py-2.5 bg-[var(--cta)] hover:bg-[var(--cta-hover)] text-white text-xs font-bold rounded-xl transition-all shadow-[var(--shadow-cta-glow)] flex items-center justify-center gap-2"
                        >
                          {registering ? "Confirming..." : "Confirm"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button 
                      onClick={() => setShowForm(true)}
                      className="w-full py-3 bg-[var(--cta)] hover:bg-[var(--cta-hover)] text-white font-bold rounded-xl transition-all shadow-[var(--shadow-cta-glow)] flex items-center justify-center gap-2"
                    >
                      Register Now
                    </button>
                  )}
                </div>
              </motion.div>

              {/* Event Metadata Detail Card */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }}
                className="card-bezel"
              >
                <div className="card-bezel-inner p-6 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] border-b border-[var(--surface-border)] pb-2">Schedule & Venue</h4>
                  <div className="space-y-3">
                    <div className="flex gap-3 text-sm">
                      <Clock className="w-5 h-5 text-[var(--accent)] shrink-0" />
                      <div>
                        <div className="font-semibold text-[13px]">{event.date}</div>
                        <div className="text-[11px] text-[var(--foreground-muted)]">{event.time}</div>
                      </div>
                    </div>
                    <div className="flex gap-3 text-sm">
                      <MapPin className="w-5 h-5 text-[var(--accent)] shrink-0" />
                      <div>
                        <div className="font-semibold text-[13px]">{event.venue}</div>
                        <div className="text-[11px] text-[var(--foreground-muted)]">RIT Campus, Chennai</div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Contact Person Details */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }}
                className="card-bezel"
              >
                <div className="card-bezel-inner p-6 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] border-b border-[var(--surface-border)] pb-2">Event Coordinators</h4>
                  <div className="space-y-3">
                    <div className="space-y-0.5">
                      <div className="font-semibold text-[13px] text-[var(--foreground)]">{event.contactName}</div>
                      <div className="text-[11px] text-[var(--foreground-muted)]">Faculty Coordinator</div>
                    </div>
                    <div className="space-y-2 text-xs border-t border-[var(--surface-border)] pt-2.5">
                      <a href={`mailto:${event.contactEmail}`} className="flex items-center gap-2.5 text-[var(--foreground-secondary)] hover:text-[var(--accent)] transition-colors">
                        <EnvelopeSimple className="w-4 h-4 shrink-0" />
                        <span>{event.contactEmail}</span>
                      </a>
                      <a href={`tel:${event.contactPhone}`} className="flex items-center gap-2.5 text-[var(--foreground-secondary)] hover:text-[var(--accent)] transition-colors">
                        <Phone className="w-4 h-4 shrink-0" />
                        <span>{event.contactPhone}</span>
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>

            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
