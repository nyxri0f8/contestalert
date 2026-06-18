"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  PencilSimple,
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

export default function EditEventPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

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

  // External-only
  const [externalLink, setExternalLink] = useState("");

  useEffect(() => {
    async function loadEvent() {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.from("events").select("*").eq("id", id).maybeSingle();

        if (data) {
          setEventType(data.event_type || "internal");
          setTitle(data.title);
          setCategory(data.category);
          setDepartment(data.department || "All");
          setDate(data.event_date ? new Date(data.event_date).toISOString().slice(0, 16) : "");
          setVenue(data.venue || "");
          setSeats(String(data.capacity || 60));
          setFee(String(data.fee || 0));
          setImage(data.cover_image || "");
          setDesc(data.description || "");
          setRules(data.rules || "");
          setEligibility(data.eligibility || "");

          // Internal fields
          setHostedBy(data.hosted_by || "department");
          setHostedByName(data.hosted_by_name || "");
          setRegistrationOpen(data.registration_open ? new Date(data.registration_open).toISOString().slice(0, 16) : "");
          setRegistrationClose(data.registration_close ? new Date(data.registration_close).toISOString().slice(0, 16) : (data.deadline ? new Date(data.deadline).toISOString().slice(0, 16) : ""));
          setStudentCoordName(data.student_coordinator_name || "");
          setStudentCoordPhone(data.student_coordinator_phone || "");
          setStudentCoordEmail(data.student_coordinator_email || "");
          setFacultyCoordName(data.faculty_coordinator_name || data.contact_person || "");
          setFacultyCoordPhone(data.faculty_coordinator_phone || "");
          setFacultyCoordEmail(data.faculty_coordinator_email || data.contact_email || "");

          // External fields
          setExternalLink(data.external_link || "");
        } else {
          setNotFound(true);
        }
      } catch (err) {
        console.error(err);
        setNotFound(true);
      }
    }
    if (id) loadEvent();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();

      const updateData: any = {
        title,
        category,
        event_type: eventType,
        event_date: new Date(date).toISOString(),
        cover_image: image,
        description: desc,
        rules,
        eligibility,
      };

      if (eventType === "internal") {
        updateData.hosted_by = hostedBy;
        updateData.hosted_by_name = hostedByName || null;
        updateData.department = department === "All" ? null : department;
        updateData.venue = venue;
        updateData.capacity = parseInt(seats) || 100;
        updateData.fee = parseFloat(fee) || 0;
        updateData.registration_open = registrationOpen ? new Date(registrationOpen).toISOString() : null;
        updateData.registration_close = registrationClose ? new Date(registrationClose).toISOString() : null;
        updateData.deadline = registrationClose ? new Date(registrationClose).toISOString() : new Date(date).toISOString();
        updateData.student_coordinator_name = studentCoordName || null;
        updateData.student_coordinator_phone = studentCoordPhone || null;
        updateData.student_coordinator_email = studentCoordEmail || null;
        updateData.faculty_coordinator_name = facultyCoordName || null;
        updateData.faculty_coordinator_phone = facultyCoordPhone || null;
        updateData.faculty_coordinator_email = facultyCoordEmail || null;
        updateData.contact_person = facultyCoordName || null;
        updateData.contact_email = facultyCoordEmail || null;
        updateData.external_link = null;
      } else {
        updateData.external_link = externalLink;
        updateData.deadline = new Date(date).toISOString();
        updateData.capacity = 9999;
      }

      const { error } = await supabase.from("events").update(updateData).eq("id", id);

      if (error) throw error;

      router.push("/admin/events");
    } catch (err) {
      console.error(err);
      alert("Failed to save: " + (err as any).message);
    } finally {
      setLoading(false);
    }
  };

  if (notFound) {
    return (
      <div className="min-h-[100dvh] bg-transparent flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-lg font-bold">Event Not Found</h2>
          <Link href="/admin/events" className="text-sm text-[var(--accent)] hover:underline">← Back to Events</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-transparent">
      <Sidebar />
      <main className="lg:ml-[var(--sidebar-width)] min-h-[100dvh] pb-16">
        <header className="sticky top-0 z-20 glass-premium border-b border-[var(--surface-border)] px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/admin/events" className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground-secondary)] hover:text-[var(--foreground)] transition-colors">
            <ArrowLeft weight="light" className="w-4 h-4" /> Back to Manage
          </Link>
          <span className="text-xs font-bold text-[var(--foreground-muted)] uppercase tracking-wider">Edit Event</span>
        </header>

        <div className="px-6 lg:px-8 py-8 max-w-3xl mx-auto space-y-6">
          {/* Type Selector */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setEventType("internal")}
              className={`p-5 rounded-2xl border-2 transition-all duration-300 text-left ${
                eventType === "internal"
                  ? "border-[var(--accent)] bg-[var(--accent-muted)] shadow-[var(--shadow-glow)]"
                  : "border-[var(--surface-border)] hover:border-[var(--surface-border-hover)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${eventType === "internal" ? "bg-[var(--accent)]/20" : "bg-[var(--surface-border)]"}`}>
                  <Buildings weight="light" className={`w-5 h-5 ${eventType === "internal" ? "text-[var(--accent)]" : "text-[var(--foreground-muted)]"}`} />
                </div>
                <div>
                  <div className={`text-sm font-bold ${eventType === "internal" ? "text-[var(--accent-text)]" : "text-[var(--foreground)]"}`}>Internal Event</div>
                  <div className="text-[10px] text-[var(--foreground-muted)]">Campus event with full registration</div>
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setEventType("external")}
              className={`p-5 rounded-2xl border-2 transition-all duration-300 text-left ${
                eventType === "external"
                  ? "border-[var(--cta)] bg-[var(--cta-muted)] shadow-[var(--shadow-cta-glow)]"
                  : "border-[var(--surface-border)] hover:border-[var(--surface-border-hover)]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${eventType === "external" ? "bg-[var(--cta)]/20" : "bg-[var(--surface-border)]"}`}>
                  <LinkIcon weight="light" className={`w-5 h-5 ${eventType === "external" ? "text-[var(--cta)]" : "text-[var(--foreground-muted)]"}`} />
                </div>
                <div>
                  <div className={`text-sm font-bold ${eventType === "external" ? "text-[var(--cta-text)]" : "text-[var(--foreground)]"}`}>External Event</div>
                  <div className="text-[10px] text-[var(--foreground-muted)]">Redirect to external registration</div>
                </div>
              </div>
            </button>
          </motion.div>

          {/* Form */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="card-bezel">
            <form onSubmit={handleSubmit} className="card-bezel-inner p-6 sm:p-8 space-y-6 bg-transparent">
              <div className="flex items-center gap-2 border-b border-[var(--surface-border)] pb-3">
                <PencilSimple className="text-[var(--accent)] w-6 h-6 shrink-0" />
                <div>
                  <h2 className="text-base font-bold">Edit {eventType === "internal" ? "Internal" : "External"} Event</h2>
                  <p className="text-[10px] text-[var(--foreground-muted)]">Changes are saved immediately on publish.</p>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className={labelClass}>Event Title</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
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
                  <input type="datetime-local" required value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
                </div>
              </div>

              {/* Internal fields */}
              <AnimatePresence mode="wait">
                {eventType === "internal" && (
                  <motion.div key="int" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease: EASE_OUT_EXPO }} className="space-y-6 overflow-hidden">
                    {/* Hosted By */}
                    <div className="space-y-2">
                      <label className={labelClass}>Hosted By</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {HOSTED_BY_OPTIONS.map((opt) => (
                          <button key={opt.value} type="button" onClick={() => setHostedBy(opt.value)}
                            className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all duration-300 ${
                              hostedBy === opt.value ? "border-[var(--accent)] bg-[var(--accent-muted)] text-[var(--accent-text)]" : "border-[var(--surface-border)] text-[var(--foreground-secondary)]"
                            }`}>
                            <opt.icon weight="light" className="w-4 h-4" /> {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {(hostedBy === "clubs" || hostedBy === "others" || hostedBy === "innovation_cell") && (
                      <div className="space-y-1">
                        <label className={labelClass}>{hostedBy === "clubs" ? "Club Name" : hostedBy === "innovation_cell" ? "Cell Name" : "Organization Name"}</label>
                        <input type="text" value={hostedByName} onChange={(e) => setHostedByName(e.target.value)} className={inputClass} />
                      </div>
                    )}

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

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className={labelClass}>Registration Opens</label>
                        <input type="datetime-local" value={registrationOpen} onChange={(e) => setRegistrationOpen(e.target.value)} className={inputClass} />
                      </div>
                      <div className="space-y-1">
                        <label className={labelClass}>Registration Closes</label>
                        <input type="datetime-local" required value={registrationClose} onChange={(e) => setRegistrationClose(e.target.value)} className={inputClass} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className={labelClass}>Venue</label>
                        <input type="text" required value={venue} onChange={(e) => setVenue(e.target.value)} className={inputClass} />
                      </div>
                      <div className="space-y-1">
                        <label className={labelClass}>Seat Capacity</label>
                        <input type="number" required value={seats} onChange={(e) => setSeats(e.target.value)} className={inputClass} />
                      </div>
                      <div className="space-y-1">
                        <label className={labelClass}>Fee (₹)</label>
                        <input type="number" required value={fee} onChange={(e) => setFee(e.target.value)} className={inputClass} />
                      </div>
                    </div>

                    {/* Student Coordinator */}
                    <div className="border-t border-[var(--surface-border)] pt-4 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] flex items-center gap-2">
                        <GraduationCap weight="light" className="w-4 h-4 text-[var(--accent)]" /> Student Coordinator
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1"><label className={labelClass}>Name</label><input type="text" value={studentCoordName} onChange={(e) => setStudentCoordName(e.target.value)} className={inputClass} /></div>
                        <div className="space-y-1"><label className={labelClass}>Phone</label><input type="tel" value={studentCoordPhone} onChange={(e) => setStudentCoordPhone(e.target.value)} className={inputClass} /></div>
                        <div className="space-y-1"><label className={labelClass}>Email</label><input type="email" value={studentCoordEmail} onChange={(e) => setStudentCoordEmail(e.target.value)} className={inputClass} /></div>
                      </div>
                    </div>

                    {/* Faculty Coordinator */}
                    <div className="border-t border-[var(--surface-border)] pt-4 space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--foreground-muted)] flex items-center gap-2">
                        <Buildings weight="light" className="w-4 h-4 text-[var(--cta)]" /> Faculty Coordinator
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1"><label className={labelClass}>Name</label><input type="text" value={facultyCoordName} onChange={(e) => setFacultyCoordName(e.target.value)} className={inputClass} /></div>
                        <div className="space-y-1"><label className={labelClass}>Phone</label><input type="tel" value={facultyCoordPhone} onChange={(e) => setFacultyCoordPhone(e.target.value)} className={inputClass} /></div>
                        <div className="space-y-1"><label className={labelClass}>Email</label><input type="email" value={facultyCoordEmail} onChange={(e) => setFacultyCoordEmail(e.target.value)} className={inputClass} /></div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {eventType === "external" && (
                  <motion.div key="ext" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.4, ease: EASE_OUT_EXPO }} className="space-y-4 overflow-hidden">
                    <div className="space-y-1">
                      <label className={labelClass}>External Registration Link *</label>
                      <input type="url" required placeholder="https://..." value={externalLink} onChange={(e) => setExternalLink(e.target.value)} className={inputClass} />
                      <p className="text-[10px] text-[var(--foreground-muted)]">Students will be redirected here to register.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Common fields */}
              <div className="space-y-1">
                <label className={labelClass}>Cover Image URL</label>
                <input type="url" value={image} onChange={(e) => setImage(e.target.value)} className={inputClass} />
              </div>

              <div className="space-y-1">
                <label className={labelClass}>Description</label>
                <textarea rows={4} required value={desc} onChange={(e) => setDesc(e.target.value)} className={inputClass} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelClass}>Rules</label>
                  <textarea rows={4} value={rules} onChange={(e) => setRules(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Eligibility</label>
                  <textarea rows={4} value={eligibility} onChange={(e) => setEligibility(e.target.value)} className={inputClass} />
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-[var(--surface-border)]">
                <Link href="/admin/events" className="px-5 py-3 rounded-xl border border-[var(--surface-border)] hover:bg-[var(--surface-subtle)] text-xs font-bold transition-all">Cancel</Link>
                <button type="submit" disabled={loading} className="px-6 py-3 bg-[var(--cta)] hover:bg-[var(--cta-hover)] text-white text-xs font-bold rounded-xl transition-all shadow-[var(--shadow-cta-glow)] disabled:opacity-50">
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
