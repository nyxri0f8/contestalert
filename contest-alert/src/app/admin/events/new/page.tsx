"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  PlusCircle,
  Buildings,
  Link as LinkIcon,
  GraduationCap,
  Lightbulb,
  UsersThree,
  DotsThreeCircle,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { Sidebar } from "@/components/shared/Sidebar";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;
const fadeUp = {
  hidden: { opacity: 0, y: 15, filter: "blur(4px)" },
  visible: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.5, ease: EASE_OUT_EXPO } },
};

const inputClass = "w-full p-3 rounded-xl border border-[var(--surface-border)] bg-[var(--background)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 focus:border-[var(--accent)] transition-all duration-300";
const labelClass = "text-xs font-semibold text-[var(--foreground-secondary)]";

const HOSTED_BY_OPTIONS = [
  { value: "department", label: "Department", icon: Buildings },
  { value: "innovation_cell", label: "Innovation Cell", icon: Lightbulb },
  { value: "clubs", label: "Clubs", icon: UsersThree },
  { value: "others", label: "Others", icon: DotsThreeCircle },
];

export default function CreateEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // Event type
  const [eventType, setEventType] = useState<"internal" | "external">("internal");

  // Common fields
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("hackathon");
  const [desc, setDesc] = useState("");
  const [rules, setRules] = useState("");
  const [eligibility, setEligibility] = useState("");
  const [image, setImage] = useState("");
  const [date, setDate] = useState("");

  // Internal-only fields
  const [hostedBy, setHostedBy] = useState("department");
  const [hostedByName, setHostedByName] = useState("");
  const [department, setDepartment] = useState("CSE");
  const [venue, setVenue] = useState("");
  const [seats, setSeats] = useState("60");
  const [fee, setFee] = useState("0");
  const [registrationOpen, setRegistrationOpen] = useState("");
  const [registrationClose, setRegistrationClose] = useState("");

  // Student Coordinator
  const [studentCoordName, setStudentCoordName] = useState("");
  const [studentCoordPhone, setStudentCoordPhone] = useState("");
  const [studentCoordEmail, setStudentCoordEmail] = useState("");

  // Faculty Coordinator
  const [facultyCoordName, setFacultyCoordName] = useState("");
  const [facultyCoordPhone, setFacultyCoordPhone] = useState("");
  const [facultyCoordEmail, setFacultyCoordEmail] = useState("");

  // External-only fields
  const [externalLink, setExternalLink] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const eventData: any = {
        title,
        category,
        event_type: eventType,
        event_date: new Date(date).toISOString(),
        cover_image: image || `https://picsum.photos/seed/${Math.random()}/800/500`,
        description: desc,
        rules,
        eligibility,
        status: "active",
        created_by: user.id,
      };

      if (eventType === "internal") {
        eventData.hosted_by = hostedBy;
        eventData.hosted_by_name = hostedByName || null;
        eventData.department = department === "All" ? null : department;
        eventData.venue = venue;
        eventData.capacity = parseInt(seats) || 100;
        eventData.fee = parseFloat(fee) || 0;
        eventData.registration_open = registrationOpen ? new Date(registrationOpen).toISOString() : null;
        eventData.registration_close = registrationClose ? new Date(registrationClose).toISOString() : null;
        eventData.deadline = registrationClose ? new Date(registrationClose).toISOString() : new Date(date).toISOString();
        eventData.student_coordinator_name = studentCoordName || null;
        eventData.student_coordinator_phone = studentCoordPhone || null;
        eventData.student_coordinator_email = studentCoordEmail || null;
        eventData.faculty_coordinator_name = facultyCoordName || null;
        eventData.faculty_coordinator_phone = facultyCoordPhone || null;
        eventData.faculty_coordinator_email = facultyCoordEmail || null;
        // backward compat
        eventData.contact_person = facultyCoordName || null;
        eventData.contact_email = facultyCoordEmail || null;
      } else {
        eventData.external_link = externalLink;
        eventData.deadline = new Date(date).toISOString();
        eventData.capacity = 9999; // no capacity limit for external
      }

      const { error } = await supabase.from("events").insert(eventData);

      if (error) throw error;

      router.push("/admin/events");
    } catch (err) {
      console.error("Failed to create event", err);
      alert("Error creating event: " + (err as any).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-transparent">
      <Sidebar />
      <main className="lg:ml-[var(--sidebar-width)] min-h-[100dvh] pb-16">
        {/* Header */}
        <header className="sticky top-0 z-20 glass-premium border-b border-[var(--surface-border)] px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link
            href="/admin/events"
            className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft weight="light" className="w-4 h-4" /> Back to Manage
          </Link>
          <span className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider">
            New Event Creation
          </span>
        </header>

        <div className="px-6 lg:px-8 py-8 max-w-3xl mx-auto space-y-6">
          {/* ============ EVENT TYPE SELECTOR ============ */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setEventType("internal")}
              className={`p-5 rounded-2xl border-2 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] text-left space-y-2 ${
                eventType === "internal"
                  ? "border-[var(--accent)] bg-[var(--accent-muted)] shadow-[var(--shadow-glow)]"
                  : "border-[var(--surface-border)] hover:border-[var(--surface-border-hover)] bg-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  eventType === "internal" ? "bg-[var(--accent)]/20" : "bg-[var(--surface-border)]"
                }`}>
                  <Buildings weight="light" className={`w-5 h-5 ${eventType === "internal" ? "text-[var(--accent)]" : "text-[var(--foreground-muted)]"}`} />
                </div>
                <div>
                  <div className={`text-sm font-bold ${eventType === "internal" ? "text-[var(--accent-text)]" : "text-[var(--foreground)]"}`}>
                    Internal Event
                  </div>
                  <div className="text-[10px] text-[var(--foreground-muted)]">Campus event with full registration</div>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setEventType("external")}
              className={`p-5 rounded-2xl border-2 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] text-left space-y-2 ${
                eventType === "external"
                  ? "border-[var(--cta)] bg-[var(--cta-muted)] shadow-[var(--shadow-cta-glow)]"
                  : "border-[var(--surface-border)] hover:border-[var(--surface-border-hover)] bg-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  eventType === "external" ? "bg-[var(--cta)]/20" : "bg-[var(--surface-border)]"
                }`}>
                  <LinkIcon weight="light" className={`w-5 h-5 ${eventType === "external" ? "text-[var(--cta)]" : "text-[var(--foreground-muted)]"}`} />
                </div>
                <div>
                  <div className={`text-sm font-bold ${eventType === "external" ? "text-[var(--cta-text)]" : "text-[var(--foreground)]"}`}>
                    External Event
                  </div>
                  <div className="text-[10px] text-[var(--foreground-muted)]">Redirect to external registration</div>
                </div>
              </div>
            </button>
          </motion.div>

          {/* ============ FORM ============ */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="card-bezel">
            <form onSubmit={handleSubmit} className="card-bezel-inner p-6 sm:p-8 space-y-6 bg-transparent">
              <div className="flex items-center gap-2 border-b border-[var(--surface-border)] pb-3">
                <PlusCircle className="text-[var(--accent)] w-6 h-6 shrink-0" />
                <div>
                  <h2 className="text-base font-bold">
                    {eventType === "internal" ? "Launch Internal Campus Event" : "Add External Event Redirect"}
                  </h2>
                  <p className="text-[10px] text-[var(--foreground-muted)]">
                    {eventType === "internal"
                      ? "Creates a full event with in-app registration, tickets, and attendance."
                      : "Links to an external platform. Students confirm registration after signing up there."}
                  </p>
                </div>
              </div>

              {/* === COMMON FIELDS === */}
              <div className="space-y-1">
                <label className={labelClass}>Event Title</label>
                <input
                  type="text"
                  required
                  placeholder={eventType === "internal" ? "e.g. CodeStorm Hackathon 2026" : "e.g. Smart India Hackathon 2026"}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelClass}>Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
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
                  <label className={labelClass}>Event Date & Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* === INTERNAL-ONLY FIELDS === */}
              <AnimatePresence mode="wait">
                {eventType === "internal" && (
                  <motion.div
                    key="internal-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                    className="space-y-6 overflow-hidden"
                  >
                    {/* Hosted By */}
                    <div className="space-y-2">
                      <label className={labelClass}>Hosted By</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {HOSTED_BY_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setHostedBy(opt.value)}
                            className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all duration-300 ${
                              hostedBy === opt.value
                                ? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent-text)]"
                                : "border-[var(--surface-border)] text-[var(--foreground-secondary)] hover:border-[var(--surface-border-hover)]"
                            }`}
                          >
                            <opt.icon weight="light" className="w-4 h-4" />
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Club/Cell name (if clubs or others) */}
                    {(hostedBy === "clubs" || hostedBy === "others" || hostedBy === "innovation_cell") && (
                      <div className="space-y-1">
                        <label className={labelClass}>
                          {hostedBy === "clubs" ? "Club Name" : hostedBy === "innovation_cell" ? "Cell Name" : "Organization Name"}
                        </label>
                        <input
                          type="text"
                          placeholder={hostedBy === "clubs" ? "e.g. Coding Club, Robotics Club" : "e.g. Innovation & Incubation Cell"}
                          value={hostedByName}
                          onChange={(e) => setHostedByName(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    )}

                    {/* Department selector (if hosted by department) */}
                    {hostedBy === "department" && (
                      <div className="space-y-1">
                        <label className={labelClass}>Organizing Department</label>
                        <select value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClass}>
                          <option value="CSE">Computer Science (CSE)</option>
                          <option value="ECE">Electronics (ECE)</option>
                          <option value="AIML">Artificial Intelligence (AIML)</option>
                          <option value="AIDS">Data Science (AIDS)</option>
                          <option value="CCE">Computer & Communication (CCE)</option>
                          <option value="Biotechnology">Biotechnology (BT)</option>
                          <option value="Mechanical">Mechanical (ME)</option>
                          <option value="All">All Departments / General</option>
                        </select>
                      </div>
                    )}

                    {/* Registration Open/Close */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className={labelClass}>Registration Opens</label>
                        <input
                          type="datetime-local"
                          value={registrationOpen}
                          onChange={(e) => setRegistrationOpen(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={labelClass}>Registration Closes</label>
                        <input
                          type="datetime-local"
                          required
                          value={registrationClose}
                          onChange={(e) => setRegistrationClose(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    {/* Venue, Seats, Fee */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className={labelClass}>Venue</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Main Auditorium"
                          value={venue}
                          onChange={(e) => setVenue(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={labelClass}>Seat Capacity</label>
                        <input
                          type="number"
                          required
                          placeholder="60"
                          value={seats}
                          onChange={(e) => setSeats(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={labelClass}>Registration Fee (₹)</label>
                        <input
                          type="number"
                          required
                          placeholder="0 for Free"
                          value={fee}
                          onChange={(e) => setFee(e.target.value)}
                          className={inputClass}
                        />
                      </div>
                    </div>

                    {/* Student Coordinator */}
                    <div className="border-t border-[var(--surface-border)] pt-4 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] flex items-center gap-2">
                        <GraduationCap weight="light" className="w-4 h-4 text-[var(--accent)]" />
                        Student Coordinator
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className={labelClass}>Full Name</label>
                          <input type="text" placeholder="e.g. Varun Kumar" value={studentCoordName} onChange={(e) => setStudentCoordName(e.target.value)} className={inputClass} />
                        </div>
                        <div className="space-y-1">
                          <label className={labelClass}>Phone</label>
                          <input type="tel" placeholder="+91 98401 23456" value={studentCoordPhone} onChange={(e) => setStudentCoordPhone(e.target.value)} className={inputClass} />
                        </div>
                        <div className="space-y-1">
                          <label className={labelClass}>Email</label>
                          <input type="email" placeholder="varun@rit.edu" value={studentCoordEmail} onChange={(e) => setStudentCoordEmail(e.target.value)} className={inputClass} />
                        </div>
                      </div>
                    </div>

                    {/* Faculty Coordinator */}
                    <div className="border-t border-[var(--surface-border)] pt-4 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] flex items-center gap-2">
                        <Buildings weight="light" className="w-4 h-4 text-[var(--cta)]" />
                        Faculty Coordinator
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <label className={labelClass}>Full Name</label>
                          <input type="text" placeholder="Dr. A. Ramesh" value={facultyCoordName} onChange={(e) => setFacultyCoordName(e.target.value)} className={inputClass} />
                        </div>
                        <div className="space-y-1">
                          <label className={labelClass}>Phone</label>
                          <input type="tel" placeholder="+91 98401 23456" value={facultyCoordPhone} onChange={(e) => setFacultyCoordPhone(e.target.value)} className={inputClass} />
                        </div>
                        <div className="space-y-1">
                          <label className={labelClass}>Email</label>
                          <input type="email" placeholder="ramesh@rit.edu" value={facultyCoordEmail} onChange={(e) => setFacultyCoordEmail(e.target.value)} className={inputClass} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* === EXTERNAL-ONLY FIELDS === */}
                {eventType === "external" && (
                  <motion.div
                    key="external-fields"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="space-y-1">
                      <label className={labelClass}>External Registration Link *</label>
                      <input
                        type="url"
                        required
                        placeholder="https://sih.gov.in/register or https://unstop.com/..."
                        value={externalLink}
                        onChange={(e) => setExternalLink(e.target.value)}
                        className={inputClass}
                      />
                      <p className="text-[10px] text-[var(--foreground-muted)]">
                        Students will be redirected here to register. They can confirm their registration back on this platform.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* === COMMON: Cover Image === */}
              <div className="space-y-1">
                <label className={labelClass}>Cover Image URL</label>
                <input
                  type="url"
                  placeholder="Leave empty for auto random image"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* === COMMON: Description === */}
              <div className="space-y-1">
                <label className={labelClass}>Description</label>
                <textarea
                  rows={4}
                  required
                  placeholder={eventType === "internal"
                    ? "Detailed information about the event, schedule, outline..."
                    : "Brief description of what the external event is about, what students will gain..."}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className={inputClass}
                />
              </div>

              {/* === COMMON: Rules & Eligibility === */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelClass}>Rules (One per line)</label>
                  <textarea
                    rows={4}
                    placeholder="1. Team size: 2-4&#10;2. Bring laptops"
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Eligibility</label>
                  <textarea
                    rows={4}
                    placeholder="Open to CSE, IT, ECE engineering streams."
                    value={eligibility}
                    onChange={(e) => setEligibility(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* === SUBMIT === */}
              <div className="flex gap-3 justify-end pt-4 border-t border-[var(--surface-border)]">
                <Link
                  href="/admin/events"
                  className="px-5 py-3 rounded-xl border border-[var(--surface-border)] hover:bg-[var(--surface-subtle)] text-xs font-bold transition-all"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-[var(--cta)] hover:bg-[var(--cta-hover)] text-white text-xs font-bold rounded-xl transition-all shadow-[var(--shadow-cta-glow)] flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? "Publishing..." : eventType === "internal" ? "Publish Internal Event" : "Publish External Event"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
