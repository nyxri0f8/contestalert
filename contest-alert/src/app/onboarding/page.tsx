"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowLeft,
  User,
  Hash,
  Phone,
  EnvelopeSimple,
  Buildings,
  GraduationCap,
  CheckCircle,
} from "@phosphor-icons/react";
import { createClient } from "@/lib/supabase/client";
import { DEPARTMENTS } from "@/types";

const EASE_OUT_EXPO = [0.32, 0.72, 0, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE_OUT_EXPO } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
};

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    register_number: "",
    phone: "",
    secondary_email: "",
    department: "",
    year: "",
    section: "",
  });

  function updateField(field: string, value: string) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null); // Clear error on change
  }

  function handleNext() {
    if (step === 1) {
      if (!formData.name || !formData.register_number || !formData.phone || !formData.secondary_email) {
        setError("All fields are required.");
        return;
      }
      const regNum = formData.register_number.trim();
      if (!/^\d+$/.test(regNum)) {
        setError("Register Number must contain only numbers.");
        return;
      }
      const phoneNum = formData.phone.trim();
      if (!/^\d{10}$/.test(phoneNum)) {
        setError("Phone Number must be exactly 10 digits.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(formData.secondary_email)) {
        setError("Please enter a valid secondary email address (e.g., name@gmail.com).");
        return;
      }
    }
    
    if (step === 2) {
      if (!formData.department || !formData.year || !formData.section) {
        setError("All fields (Department, Year, Section) are required.");
        return;
      }
    }

    setError(null);
    setStep(step + 1);
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated. Please sign in again.");
      setLoading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        name: formData.name.trim(),
        register_number: formData.register_number.trim(),
        phone: formData.phone.trim(),
        secondary_email: formData.secondary_email,
        department: formData.department,
        year: parseInt(formData.year),
        section: formData.section.toUpperCase(),
        onboarding_completed: true,
      })
      .eq("id", user.id);

    if (updateError) {
      if (updateError.message.includes("duplicate")) {
        setError("This register number is already taken.");
      } else {
        setError(updateError.message);
      }
      setLoading(false);
      return;
    }

    // Update the Auth user metadata immediately
    await supabase.auth.updateUser({
      data: { onboarding_completed: true, role: "student" }
    });

    router.push("/dashboard");
  }

  const totalSteps = 3;

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-4 py-12 bg-transparent">

      <motion.div variants={stagger} initial="hidden" animate="visible" className="relative w-full max-w-lg">
        {/* Logo */}
        <motion.div variants={fadeUp} className="text-center mb-8 space-y-4 flex flex-col items-center">
          <div className="inline-flex items-center gap-2.5">
            <div className="bg-white dark:bg-white/95 px-2.5 py-1.5 rounded-xl border border-neutral-100 shadow-sm flex items-center justify-center shrink-0">
              <img src="/images/logo.png" alt="RIT Logo" className="h-7 w-auto object-contain" />
            </div>
            <span className="text-[var(--surface-border)] font-normal text-lg">|</span>
            <span className="font-display font-extrabold text-base tracking-tight block leading-none text-[var(--foreground)]">Contest Alert</span>
          </div>
          <div>
            <p className="text-sm text-[var(--foreground-muted)]">Step {step} of {totalSteps}</p>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div variants={fadeUp} className="mb-8">
          <div className="h-1.5 bg-[var(--surface-border)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[var(--accent)] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            />
          </div>
        </motion.div>

        {/* Card */}
        <motion.div variants={fadeUp} className="card-bezel-elevated">
          <div className="card-bezel-inner p-8">
            {error && (
              <div className="mb-6 px-4 py-3 rounded-xl bg-[var(--cta-muted)] text-[var(--cta)] text-sm font-medium border border-[var(--cta)]/20">
                {error}
              </div>
            )}

            {/* Step 1: Personal Info */}
            {step === 1 && (
              <motion.div key="step1" variants={stagger} initial="hidden" animate="visible" className="space-y-5">
                <motion.div variants={fadeUp} className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--foreground-secondary)]">Full Name</label>
                  <div className="relative">
                    <User weight="light" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                    <input
                      type="text" value={formData.name} onChange={(e) => updateField("name", e.target.value)}
                      placeholder="Your full name" required
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-sm placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all duration-300"
                    />
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--foreground-secondary)]">Register Number</label>
                  <div className="relative">
                    <Hash weight="light" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                    <input
                      type="text" value={formData.register_number} onChange={(e) => updateField("register_number", e.target.value)}
                      placeholder="e.g., 312621104001" required
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-sm placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all duration-300"
                    />
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--foreground-secondary)]">Phone Number</label>
                  <div className="relative">
                    <Phone weight="light" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                    <input
                      type="tel" value={formData.phone} onChange={(e) => updateField("phone", e.target.value.replace(/\\D/g, ''))}
                      placeholder="e.g. 9876543210" required maxLength={10}
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-sm placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all duration-300"
                    />
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--foreground-secondary)]">Secondary Email ID</label>
                  <div className="relative">
                    <EnvelopeSimple weight="light" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                    <input
                      type="email" value={formData.secondary_email} onChange={(e) => updateField("secondary_email", e.target.value)}
                      placeholder="e.g., secondary@gmail.com" required
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-sm placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all duration-300"
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Step 2: Academic Info */}
            {step === 2 && (
              <motion.div key="step2" variants={stagger} initial="hidden" animate="visible" className="space-y-5">
                <motion.div variants={fadeUp} className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--foreground-secondary)]">Department</label>
                  <div className="relative">
                    <Buildings weight="light" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                    <select
                      value={formData.department} onChange={(e) => updateField("department", e.target.value)}
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all duration-300"
                    >
                      <option value="">Select department</option>
                      {DEPARTMENTS.map((d) => (
                        <option key={d.value} value={d.value}>{d.label} — {d.full}</option>
                      ))}
                    </select>
                  </div>
                </motion.div>

                <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--foreground-secondary)]">Year</label>
                    <div className="relative">
                      <GraduationCap weight="light" className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--foreground-muted)]" />
                      <select
                        value={formData.year} onChange={(e) => updateField("year", e.target.value)}
                        required
                        className="w-full pl-11 pr-4 py-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all duration-300"
                      >
                        <option value="">Year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-[var(--foreground-secondary)]">Section</label>
                    <input
                      type="text" value={formData.section} onChange={(e) => updateField("section", e.target.value)}
                      placeholder="A, B, C..." maxLength={2}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--surface-border)] bg-[var(--surface)] text-sm placeholder:text-[var(--foreground-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] transition-all duration-300"
                    />
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <motion.div key="step3" variants={stagger} initial="hidden" animate="visible" className="space-y-5">
                <motion.div variants={fadeUp} className="text-center space-y-2">
                  <CheckCircle weight="light" className="w-12 h-12 text-[var(--accent)] mx-auto" />
                  <h3 className="font-semibold text-lg">Review Your Details</h3>
                </motion.div>
                <motion.div variants={fadeUp} className="space-y-3">
                  {[
                    { label: "Name", value: formData.name },
                    { label: "Register No.", value: formData.register_number },
                    { label: "Phone", value: formData.phone },
                    { label: "Secondary Email", value: formData.secondary_email },
                    { label: "Department", value: DEPARTMENTS.find((d) => d.value === formData.department)?.full || formData.department },
                    { label: "Year", value: formData.year ? `Year ${formData.year}` : "" },
                    { label: "Section", value: formData.section.toUpperCase() },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2 border-b border-[var(--surface-border)] last:border-0 font-body">
                      <span className="text-sm text-[var(--foreground-muted)]">{item.label}</span>
                      <span className="text-sm font-medium">{item.value || "—"}</span>
                    </div>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 gap-3">
              {step > 1 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl border border-[var(--surface-border)] text-sm font-medium hover:bg-[var(--surface-subtle)] transition-all duration-300 active:scale-[0.98] cursor-pointer"
                >
                  <ArrowLeft weight="light" className="w-3.5 h-3.5" /> Back
                </button>
              ) : (
                <div />
              )}

              {step < totalSteps ? (
                <button
                  onClick={handleNext}
                  className="group flex items-center gap-2 pl-6 pr-3 py-3 rounded-xl bg-[var(--cta)] text-white text-sm font-semibold transition-all duration-300 hover:shadow-[var(--shadow-cta-glow)] active:scale-[0.98] disabled:opacity-40 cursor-pointer"
                >
                  Continue
                  <span className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 transition-transform duration-300">
                    <ArrowRight weight="light" className="w-3.5 h-3.5" />
                  </span>
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="group flex items-center gap-2 pl-6 pr-3 py-3 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold transition-all duration-300 hover:shadow-[var(--shadow-glow)] active:scale-[0.98] disabled:opacity-40 cursor-pointer"
                >
                  {loading ? "Saving..." : "Complete Profile"}
                  <span className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 transition-transform duration-300">
                    <CheckCircle weight="light" className="w-3.5 h-3.5" />
                  </span>
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
