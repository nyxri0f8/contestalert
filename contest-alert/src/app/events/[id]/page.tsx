"use client";

import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  Clock,
  MapPin,
  Users,
  Phone,
  EnvelopeSimple,
  Info,
  BookOpen,
  ArrowLeft,
  Ticket,
  CheckCircle,
  ShareNetwork,
  CurrencyInr,
  ArrowSquareOut,
  Link as LinkIcon,
  Buildings,
  GraduationCap,
  Lightbulb,
  UsersThree,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { getEventImageUrls } from "@/lib/supabase/storage";
import { Sidebar } from "@/components/shared/Sidebar";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
};

const HOSTED_BY_LABELS: Record<string, { label: string; icon: any }> = {
  department: { label: "Department", icon: Buildings },
  innovation_cell: { label: "Innovation Cell", icon: Lightbulb },
  clubs: { label: "Club", icon: UsersThree },
  others: { label: "Organization", icon: Buildings },
};

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [event, setEvent] = useState<any | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [phone, setPhone] = useState("");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [transactionId, setTransactionId] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [confirmingExternal, setConfirmingExternal] = useState(false);

  useEffect(() => {
    async function loadEventDetails() {
      if (!id) return;
      try {
        const supabase = createClient();

        const { data: dbEvent, error } = await supabase
          .from("events")
          .select("*, registrations(count)")
          .eq("id", id)
          .single();
        const [eventWithImage] = dbEvent ? await getEventImageUrls([dbEvent]) : [null];
        const finalDbEvent = eventWithImage || dbEvent;
        let paymentQrUrl = null;
        if (dbEvent.payment_qr_path) {
          const { data: qrData } = await supabase.storage.from("payment-qrs").createSignedUrl(dbEvent.payment_qr_path, 3600);
          paymentQrUrl = qrData?.signedUrl || null;
        }

        if (error || !dbEvent) {
          console.error("Event not found:", error);
          return;
        }

        const registeredCount = dbEvent.registrations?.[0]?.count || 0;
        const remainingSeats = Math.max(0, dbEvent.capacity - registeredCount);

        const deadlineDate = new Date(dbEvent.deadline);
        const diff = deadlineDate.getTime() - Date.now();
        const deadlineStatus =
          diff < 0 ? "critical" : diff < 86400000 ? "urgent" : diff < 86400000 * 3 ? "warn" : "safe";

        setEvent({
          id: dbEvent.id,
          title: dbEvent.title,
          category: dbEvent.category,
          department: dbEvent.department || "All",
          eventType: dbEvent.event_type || "internal",
          hostedBy: dbEvent.hosted_by || "department",
          hostedByName: dbEvent.hosted_by_name || null,
          externalLink: dbEvent.external_link || null,
          date: new Date(dbEvent.event_date).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          }),
          formSchema: dbEvent.form_schema || [],
          time: new Date(dbEvent.event_date).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          }),
          venue: dbEvent.venue,
          seats: remainingSeats,
          total: dbEvent.capacity,
          deadline: deadlineStatus,
          deadlinedate: new Date(dbEvent.deadline).toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          }),
          fee: parseFloat(dbEvent.fee) || 0,
          paymentLink: dbEvent.payment_link || null,
          paymentQrUrl: paymentQrUrl,
          // Coordinators (new columns with fallback)
          studentCoordName: dbEvent.student_coordinator_name || null,
          studentCoordPhone: dbEvent.student_coordinator_phone || null,
          studentCoordEmail: dbEvent.student_coordinator_email || null,
          facultyCoordName: dbEvent.faculty_coordinator_name || dbEvent.contact_person || "Faculty Coordinator",
          facultyCoordPhone: dbEvent.faculty_coordinator_phone || null,
          facultyCoordEmail: dbEvent.faculty_coordinator_email || dbEvent.contact_email || "",
          image: dbEvent.cover_image || "https://picsum.photos/seed/default/1200/600",
          desc: dbEvent.description,
          rules: dbEvent.rules || "Standard rules apply.",
          eligibility: dbEvent.eligibility || "Open to all students.",
        });

        // Check registration & fetch profile phone for pre-fill
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: regData } = await supabase
            .from("registrations")
            .select("id")
            .eq("user_id", user.id)
            .eq("event_id", id)
            .maybeSingle();

          if (regData) setIsRegistered(true);

          const { data: profileData } = await supabase
            .from("profiles")
            .select("phone")
            .eq("id", user.id)
            .maybeSingle();

          if (profileData?.phone) {
            setPhone(profileData.phone);
          }
        }
      } catch (err) {
        console.error("Error loading event details:", err);
      }
    }

    loadEventDetails();
  }, [id]);

  if (!event) {
    return (
      <div className="min-h-[100dvh] bg-transparent flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-[var(--foreground-secondary)] text-sm">Loading event details...</p>
          <button
            onClick={() => router.push("/events")}
            className="px-4 py-2 bg-[var(--surface)] text-[var(--foreground)] border border-[var(--surface-border)] rounded-xl text-sm hover:bg-[var(--surface-subtle)] transition-colors"
          >
            Go Back to Events
          </button>
        </div>
      </div>
    );
  }

  // Internal registration handler
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegistering(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("Please log in to register.");
        setRegistering(false);
        return;
      }

      const { data, error } = await supabase.rpc("register_for_event", {
        p_user_id: user.id,
        p_event_id: event.id,
        p_team_name: teamName || null,
        p_phone: phone || null,
        p_is_external_confirmation: false,
        p_form_data: formData,
        p_transaction_id: transactionId || null,
      });

      if (error || (data && !data.success)) {
        alert(error?.message || data?.error || "Registration failed.");
        setRegistering(false);
        return;
      }

      setIsRegistered(true);
      setShowForm(false);
      alert("Registration Successful!");
      setEvent((prev: any) => (prev ? { ...prev, seats: Math.max(0, prev.seats - 1) } : null));
    } catch (err) {
      console.error("Registration failed:", err);
      alert("An unexpected error occurred.");
    } finally {
      setRegistering(false);
    }
  };

  // External confirmation handler
  const handleExternalConfirm = async () => {
    setConfirmingExternal(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        alert("Please log in to confirm.");
        setConfirmingExternal(false);
        return;
      }

      const { data, error } = await supabase.rpc("register_for_event", {
        p_user_id: user.id,
        p_event_id: event.id,
        p_team_name: null,
        p_phone: null,
        p_is_external_confirmation: true,
      });

      if (error || (data && !data.success)) {
        alert(error?.message || data?.error || "Confirmation failed.");
        setConfirmingExternal(false);
        return;
      }

      setIsRegistered(true);
      alert("External registration confirmed! You'll receive +10 achievement points.");
    } catch (err) {
      console.error("Confirmation failed:", err);
      alert("An unexpected error occurred.");
    } finally {
      setConfirmingExternal(false);
    }
  };

  const deadlineStyle =
    (
      {
        safe: "text-[#4CAF50] bg-[#4CAF50]/10 border-[#4CAF50]/20",
        warn: "text-[#FF9800] bg-[#FF9800]/10 border-[#FF9800]/20",
        urgent: "text-[#FF5722] bg-[#FF5722]/10 border-[#FF5722]/20",
        critical: "text-[#D32F2F] bg-[#D32F2F]/10 border-[#D32F2F]/20 animate-pulse",
      } as Record<string, string>
    )[event.deadline] || "text-[#4CAF50] bg-[#4CAF50]/10 border-[#4CAF50]/20";

  const hostedByInfo = HOSTED_BY_LABELS[event.hostedBy] || HOSTED_BY_LABELS.department;

  return (
    <div className="min-h-[100dvh] bg-transparent">
      <Sidebar />
      <main className="lg:ml-[var(--sidebar-width)] min-h-[100dvh] pb-16">
        <header className="sticky top-0 z-20 glass-premium border-b border-[var(--surface-border)] px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
            href="/events"
            className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft weight="light" className="w-4 h-4" /> Back to Events
          </Link>
          <div className="flex gap-2 items-center">
            {/* Event type badge */}
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              event.eventType === "external"
                ? "bg-[var(--cta-muted)] text-[var(--cta)] border border-[var(--cta)]/20"
                : "bg-[var(--accent-muted)] text-[var(--accent-text)] border border-[var(--accent)]/20"
            }`}>
              {event.eventType === "external" ? "External" : "Internal"}
            </span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Link copied to clipboard!");
              }}
              className="w-9 h-9 rounded-xl border border-[var(--surface-border)] hover:bg-[var(--surface-subtle)] flex items-center justify-center text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
              title="Share Event"
            >
              <ShareNetwork weight="light" className="w-4 h-4" />
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
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${event.image})` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

              <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-end justify-between gap-4">
                <div className="space-y-2 max-w-2xl text-white">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="inline-flex px-3 py-1 rounded-full bg-[var(--accent)] text-black text-[10px] font-bold uppercase tracking-wider">
                      {event.category}
                    </span>
                    {event.eventType === "external" && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--cta)] text-white text-[10px] font-bold uppercase tracking-wider">
                        <LinkIcon weight="bold" className="w-3 h-3" /> External
                      </span>
                    )}
                  </div>
                  <h1 className="text-xl sm:text-3xl font-display font-extrabold tracking-tight leading-tight drop-shadow-md text-white">
                    {event.title}
                  </h1>
                  <p className="text-xs text-white/80 font-medium flex items-center gap-1.5">
                    <hostedByInfo.icon weight="light" className="w-3.5 h-3.5" />
                    {event.hostedByName
                      ? `${event.hostedByName} (${hostedByInfo.label})`
                      : `${hostedByInfo.label} — ${event.department}`}
                  </p>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${deadlineStyle}`}>
                    {event.eventType === "external" ? `Event: ${event.date}` : `Deadline: ${event.deadlinedate}`}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="card-bezel">
                <div className="card-bezel-inner p-6 space-y-4 bg-transparent">
                  <div className="flex items-center gap-2 border-b border-[var(--surface-border)] pb-3">
                    <Info weight="light" className="w-5 h-5 text-[var(--accent)]" />
                    <h3 className="text-base font-semibold">About the Event</h3>
                  </div>
                  <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed whitespace-pre-line">
                    {event.desc}
                  </p>
                </div>
              </motion.div>

              {/* Rules */}
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="card-bezel">
                <div className="card-bezel-inner p-6 space-y-4 bg-transparent">
                  <div className="flex items-center gap-2 border-b border-[var(--surface-border)] pb-3">
                    <BookOpen weight="light" className="w-5 h-5 text-[var(--cta)]" />
                    <h3 className="text-base font-semibold">Rules & Regulations</h3>
                  </div>
                  <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed whitespace-pre-line font-mono text-[13px] bg-[var(--surface-subtle)] p-4 rounded-xl border border-[var(--surface-border)]">
                    {event.rules}
                  </p>
                </div>
              </motion.div>

              {/* Eligibility */}
              <motion.div variants={fadeUp} initial="hidden" animate="visible" className="card-bezel">
                <div className="card-bezel-inner p-6 space-y-4 bg-transparent">
                  <div className="flex items-center gap-2 border-b border-[var(--surface-border)] pb-3">
                    <Users weight="light" className="w-5 h-5 text-[var(--accent)]" />
                    <h3 className="text-base font-semibold">Eligibility</h3>
                  </div>
                  <p className="text-sm text-[var(--foreground-secondary)] leading-relaxed">{event.eligibility}</p>
                </div>
              </motion.div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* ======= ACTION CARD ======= */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="card-bezel">
                <div className="card-bezel-inner p-6 space-y-6 bg-[var(--surface-subtle)]/50">

                  
{/* === REGISTRATION MODAL (Dynamic Form) === */}
{showForm && (
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm">
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[var(--surface)] border border-[var(--surface-border)] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
    >
      <div className="p-6 border-b border-[var(--surface-border)] flex justify-between items-center">
        <h3 className="text-lg font-bold">Register for {event.title}</h3>
        <button onClick={() => setShowForm(false)} className="text-[var(--foreground-muted)] hover:text-[var(--foreground)]">×</button>
      </div>
      
      <div className="p-6 max-h-[60vh] overflow-y-auto">
        <form id="registration-form" onSubmit={handleRegister} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Team Name (Optional)</label>
            <input type="text" placeholder="e.g. CyberKnights" value={teamName} onChange={(e) => setTeamName(e.target.value)} className="w-full p-2.5 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-sm focus:ring-1 focus:ring-[var(--accent)]" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-[var(--foreground-secondary)]">Contact Phone (Required)</label>
            <input type="tel" placeholder="e.g. 9876543210" required value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full p-2.5 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-sm focus:ring-1 focus:ring-[var(--accent)]" />
          </div>

          {/* Dynamic Fields */}
          {event.formSchema && event.formSchema.map((field: any) => (
            <div key={field.id} className="space-y-1 pt-2">
              <label className="text-xs font-semibold text-[var(--foreground-secondary)]">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>
              {field.type === 'select' ? (
                <select
                  required={field.required}
                  value={formData[field.id] || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                  className="w-full p-2.5 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-sm focus:ring-1 focus:ring-[var(--accent)]"
                >
                  <option value="">Select...</option>
                  {field.options && field.options.map((opt: string) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type === 'number' ? 'number' : 'text'}
                  required={field.required}
                  value={formData[field.id] || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                  className="w-full p-2.5 rounded-lg border border-[var(--surface-border)] bg-[var(--background)] text-sm focus:ring-1 focus:ring-[var(--accent)]"
                />
              )}
            </div>
          ))}
        </form>
      </div>

      <div className="p-6 border-t border-[var(--surface-border)] flex gap-3">
        <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-xl border border-[var(--surface-border)] hover:bg-[var(--surface-subtle)] text-sm font-bold transition-all">
          Cancel
        </button>
        <button type="submit" form="registration-form" disabled={registering} className="flex-1 py-3 bg-[var(--cta)] hover:bg-[var(--cta-hover)] text-white text-sm font-bold rounded-xl transition-all shadow-[var(--shadow-cta-glow)] flex items-center justify-center">
          {registering ? "Registering..." : "Confirm Registration"}
        </button>
      </div>
    </motion.div>
  </div>
)}

{/* === INTERNAL EVENT ACTION === */}
                  {event.eventType === "internal" && (
                    <>
                      <div className="space-y-1">
                        <div className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider font-semibold">Registration Fee</div>
                        <div className="text-3xl font-display font-extrabold text-[var(--foreground)] flex items-center gap-1">
                          {event.fee === 0 ? "FREE" : (
                            <><CurrencyInr weight="light" className="w-6 h-6 text-[var(--accent)]" /><span>{event.fee}</span></>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-medium">
                          <span className="text-[var(--foreground-secondary)]">Seats Remaining</span>
                          <span className="font-mono text-[var(--accent)] font-bold">{event.seats} / {event.total}</span>
                        </div>
                        <div className="h-2 bg-[var(--surface-border)] rounded-full overflow-hidden">
                          <div className="h-full bg-[var(--accent)] transition-all duration-500" style={{ width: `${(event.seats / event.total) * 100}%` }} />
                        </div>
                      </div>

                      {isRegistered ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center gap-2 p-3 bg-[var(--accent-muted)] border border-[var(--accent)]/30 text-[var(--accent-text)] rounded-xl text-xs font-bold uppercase tracking-wider">
                            <CheckCircle weight="light" className="w-4 h-4" /> Registered Successfully
                          </div>
                          <Link href="/tickets" className="w-full flex items-center justify-center gap-2 p-3 bg-[var(--surface)] hover:bg-[var(--surface-border)] border border-[var(--surface-border)] text-sm font-semibold rounded-xl text-[var(--foreground)] transition-colors">
                            <Ticket weight="light" className="w-4 h-4" /> View Ticket
                          </Link>
                        </div>
                      ) : (
                        <button onClick={() => setShowForm(true)} className="w-full py-3 bg-[var(--cta)] hover:bg-[var(--cta-hover)] text-white font-bold rounded-xl transition-all shadow-[var(--shadow-cta-glow)] flex items-center justify-center gap-2">
                          Register Now
                        </button>
                      )}
                    </>
                  )}

                  {/* === EXTERNAL EVENT ACTION === */}
                  {event.eventType === "external" && (
                    <>
                      <div className="space-y-2">
                        <div className="text-xs text-[var(--foreground-muted)] uppercase tracking-wider font-semibold">External Registration</div>
                        <p className="text-xs text-[var(--foreground-secondary)] leading-relaxed">
                          This event is hosted on an external platform. Register there first, then confirm here to track it.
                        </p>
                      </div>

                      {/* Step 1: Go to external site */}
                      <a
                        href={event.externalLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 bg-[var(--cta)] hover:bg-[var(--cta-hover)] text-white font-bold rounded-xl transition-all shadow-[var(--shadow-cta-glow)] flex items-center justify-center gap-2"
                      >
                        <ArrowSquareOut weight="light" className="w-4 h-4" />
                        Register on External Site
                      </a>

                      {/* Divider */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-[var(--surface-border)]" />
                        <span className="text-[10px] text-[var(--foreground-muted)] font-semibold uppercase">Then</span>
                        <div className="flex-1 h-px bg-[var(--surface-border)]" />
                      </div>

                      {/* Step 2: Confirm here */}
                      {isRegistered ? (
                        <div className="flex items-center justify-center gap-2 p-3 bg-[var(--accent-muted)] border border-[var(--accent)]/30 text-[var(--accent-text)] rounded-xl text-xs font-bold uppercase tracking-wider">
                          <CheckCircle weight="light" className="w-4 h-4" /> Registration Confirmed
                        </div>
                      ) : (
                        <button
                          onClick={handleExternalConfirm}
                          disabled={confirmingExternal}
                          className="w-full py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold rounded-xl transition-all shadow-[var(--shadow-glow)] flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                          <CheckCircle weight="light" className="w-4 h-4" />
                          {confirmingExternal ? "Confirming..." : "I've Registered — Confirm Here"}
                        </button>
                      )}

                      {/* External link info */}
                      <div className="p-3 rounded-xl bg-[var(--surface-border)]/50 border border-[var(--surface-border)]">
                        <div className="text-[10px] text-[var(--foreground-muted)] font-semibold mb-1">Registration Link</div>
                        <a href={event.externalLink} target="_blank" rel="noopener noreferrer" className="text-xs text-[var(--accent)] hover:underline break-all flex items-center gap-1">
                          <LinkIcon weight="light" className="w-3 h-3 shrink-0" />
                          {event.externalLink}
                        </a>
                      </div>
                    </>
                  )}
                </div>
              </motion.div>

              {/* Schedule & Venue (internal only) */}
              {event.eventType === "internal" && (
                <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="card-bezel">
                  <div className="card-bezel-inner p-6 space-y-4 bg-transparent">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] border-b border-[var(--surface-border)] pb-2">
                      Schedule & Venue
                    </h4>
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
              )}

              {/* Coordinators */}
              <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="card-bezel">
                <div className="card-bezel-inner p-6 space-y-4 bg-transparent">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] border-b border-[var(--surface-border)] pb-2">
                    Event Coordinators
                  </h4>
                  <div className="space-y-4">
                    {/* Faculty */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Buildings weight="light" className="w-3.5 h-3.5 text-[var(--cta)]" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)]">Faculty</span>
                      </div>
                      <div className="font-semibold text-[13px] text-[var(--foreground)]">{event.facultyCoordName}</div>
                      {event.facultyCoordEmail && (
                        <a href={`mailto:${event.facultyCoordEmail}`} className="flex items-center gap-2 text-xs text-[var(--foreground-secondary)] hover:text-[var(--accent)] transition-colors">
                          <EnvelopeSimple className="w-3.5 h-3.5 shrink-0" />{event.facultyCoordEmail}
                        </a>
                      )}
                      {event.facultyCoordPhone && (
                        <a href={`tel:${event.facultyCoordPhone}`} className="flex items-center gap-2 text-xs text-[var(--foreground-secondary)] hover:text-[var(--accent)] transition-colors">
                          <Phone className="w-3.5 h-3.5 shrink-0" />{event.facultyCoordPhone}
                        </a>
                      )}
                    </div>

                    {/* Student coordinator (if available) */}
                    {event.studentCoordName && (
                      <div className="space-y-2 border-t border-[var(--surface-border)] pt-3">
                        <div className="flex items-center gap-1.5">
                          <GraduationCap weight="light" className="w-3.5 h-3.5 text-[var(--accent)]" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--foreground-muted)]">Student</span>
                        </div>
                        <div className="font-semibold text-[13px] text-[var(--foreground)]">{event.studentCoordName}</div>
                        {event.studentCoordEmail && (
                          <a href={`mailto:${event.studentCoordEmail}`} className="flex items-center gap-2 text-xs text-[var(--foreground-secondary)] hover:text-[var(--accent)] transition-colors">
                            <EnvelopeSimple className="w-3.5 h-3.5 shrink-0" />{event.studentCoordEmail}
                          </a>
                        )}
                        {event.studentCoordPhone && (
                          <a href={`tel:${event.studentCoordPhone}`} className="flex items-center gap-2 text-xs text-[var(--foreground-secondary)] hover:text-[var(--accent)] transition-colors">
                            <Phone className="w-3.5 h-3.5 shrink-0" />{event.studentCoordPhone}
                          </a>
                        )}
                      </div>
                    )}
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
