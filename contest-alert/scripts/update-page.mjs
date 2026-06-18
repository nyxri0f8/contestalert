import fs from 'fs';

let content = fs.readFileSync('src/app/page.tsx', 'utf8');

// 1. Update nav links
content = content.replace(/\{.*?Events.*?, .*?Leaderboard.*?, .*?Spotlight.*?, .*?About.*?\}/g, '{["Events", "Leaderboard", "About"]}');

// 2. Remove StatsBar definition and hook
const statsBarStart1 = content.indexOf('// ============================================================\r\n// STATS BAR');
const eventsSectionStart1 = content.indexOf('// ============================================================\r\n// EVENTS SECTION');
const statsBarStart2 = content.indexOf('// ============================================================\n// STATS BAR');
const eventsSectionStart2 = content.indexOf('// ============================================================\n// EVENTS SECTION');

if (statsBarStart1 !== -1 && eventsSectionStart1 !== -1) {
  content = content.slice(0, statsBarStart1) + content.slice(eventsSectionStart1);
} else if (statsBarStart2 !== -1 && eventsSectionStart2 !== -1) {
  content = content.slice(0, statsBarStart2) + content.slice(eventsSectionStart2);
}

// 3. Remove eyebrow in EventsSection
content = content.replace(/<span className="eyebrow">\s*<Sparkle[^>]*\/>\s*Branch Circulars & Events\s*<\/span>/, '');

// 4. Remove useAnimatedCounter hook since StatsBar is gone
const hookStart1 = content.indexOf('// Animated counter hook');
const navStart1 = content.indexOf('// ============================================================\r\n// NAVBAR');
const navStart2 = content.indexOf('// ============================================================\n// NAVBAR');
if (hookStart1 !== -1 && navStart1 !== -1) {
  content = content.slice(0, hookStart1) + content.slice(navStart1);
} else if (hookStart1 !== -1 && navStart2 !== -1) {
  content = content.slice(0, hookStart1) + content.slice(navStart2);
}

// 5. Replace LeaderboardSection, HowItWorks, CTASection, Footer, LandingPage
const leaderboardStart1 = content.indexOf('// ============================================================\r\n// DEPARTMENT LEADERBOARD');
const leaderboardStart2 = content.indexOf('// ============================================================\n// DEPARTMENT LEADERBOARD');
const start = leaderboardStart1 !== -1 ? leaderboardStart1 : leaderboardStart2;

if (start !== -1) {
  content = content.slice(0, start);
}

content += `// ============================================================
// STUDENT LEADERBOARD — Premium Table with Rank Badges
// ============================================================

function StudentLeaderboardSection() {
  const [leaderboard] = useState<any[]>([
    { rank: 1, name: "Arun K", branch: "CSE", events: 12, points: 450, percentage: 100 },
    { rank: 2, name: "Priya R", branch: "ECE", events: 10, points: 380, percentage: 84 },
    { rank: 3, name: "Karthik M", branch: "IT", events: 8, points: 310, percentage: 68 },
    { rank: 4, name: "Suresh S", branch: "Mechanical", events: 7, points: 280, percentage: 62 },
    { rank: 5, name: "Ananya V", branch: "Civil", events: 5, points: 200, percentage: 44 }
  ]);

  return (
    <section id="leaderboard" className="py-[var(--space-section)] bg-transparent border-t border-[var(--surface-border)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-14"
        >
          {/* Left info column */}
          <motion.div variants={fadeUp} className="lg:col-span-5 space-y-7">
            <span className="eyebrow">
              <Trophy weight="light" className="w-3 h-3 text-[var(--accent)]" />
              📊 Live Rankings
            </span>
            <h2 className="!leading-[1.1]">
              Student
              <br />
              <span className="gradient-text">Leaderboard</span>
            </h2>
            <p className="text-[var(--foreground-secondary)] leading-relaxed">
              Updated in real-time. Every event, every point, every student — tracked here.
            </p>

            <div className="space-y-2.5 pt-3 border-t border-[var(--surface-border)]">
              {[
                { label: "Registered for any event", points: "+10 pts", color: "var(--accent)" },
                { label: "Attended & checked in", points: "+20 pts", color: "var(--accent)" },
                { label: "Won a national contest", points: "+50 pts", color: "var(--cta)" },
                { label: "Runner-up finish", points: "+30 pts", color: "var(--cta)" },
              ].map((rule) => (
                <div key={rule.label} className="flex items-center justify-between py-2.5 border-b border-[var(--surface-border)] last:border-0">
                  <span className="text-xs text-[var(--foreground-secondary)]">{rule.label}</span>
                  <span className="font-mono font-bold text-xs" style={{ color: rule.color }}>{rule.points}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — Leaderboard Table */}
          <motion.div variants={fadeUp} className="lg:col-span-7">
            <div className="card-bezel-elevated glass-premium">
              <div className="card-bezel-inner bg-transparent shadow-none">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 px-6 py-4 text-[10px] uppercase tracking-widest text-[var(--foreground-muted)] font-bold border-b border-[var(--surface-border)]">
                  <div className="col-span-1">Rank</div>
                  <div className="col-span-5">Student Name</div>
                  <div className="col-span-2">Branch</div>
                  <div className="col-span-2 text-right">Events</div>
                  <div className="col-span-2 text-right">Points</div>
                </div>

                {/* Rows */}
                {leaderboard.map((student, i) => (
                  <motion.div
                    key={student.name}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.5, ease: EASE_OUT_EXPO }}
                    className={\`grid grid-cols-12 gap-2 px-6 py-4 items-center border-b border-[var(--surface-border)] last:border-0 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[var(--accent-muted)] \${
                      i === 0 ? "bg-[var(--accent-muted)]/60" : ""
                    }\`}
                  >
                    <div className="col-span-1">
                      {i < 3 ? (
                        <span className={\`rank-badge \${
                          i === 0 ? "rank-badge--gold" : i === 1 ? "rank-badge--silver" : "rank-badge--bronze"
                        }\`}>
                          {i + 1}
                        </span>
                      ) : (
                        <span className="font-mono font-bold text-xs text-[var(--foreground-muted)] pl-2">{i + 1}</span>
                      )}
                    </div>
                    <div className="col-span-5 flex items-center gap-2.5 min-w-0">
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-sm block truncate">{student.name}</span>
                        {/* Progress bar */}
                        <div className="progress-bar mt-1.5 hidden sm:block">
                          <div className="progress-bar-fill" style={{ width: \`\${student.percentage}%\` }} />
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 text-[11px] text-[var(--foreground-muted)] font-semibold">
                      {student.branch}
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="font-mono text-sm text-[var(--foreground-secondary)]">{student.events}</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="font-mono font-bold text-sm">{student.points}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// DEPARTMENT LEADERBOARD — Premium Table
// ============================================================

function DepartmentLeaderboardSection() {
  const [leaderboard] = useState<any[]>([
    { rank: 1, department: "CSE", points: 2400, participants: 150, wins: 12, percentage: 100 },
    { rank: 2, department: "ECE", points: 1950, participants: 120, wins: 8, percentage: 81 },
    { rank: 3, department: "IT", points: 1800, participants: 110, wins: 7, percentage: 75 },
    { rank: 4, department: "Mechanical", points: 1200, participants: 85, wins: 4, percentage: 50 },
    { rank: 5, department: "Civil", points: 950, participants: 60, wins: 2, percentage: 39 }
  ]);

  return (
    <section className="py-[var(--space-section)] bg-transparent border-b border-[var(--surface-border)]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="space-y-10"
        >
          <motion.div variants={fadeUp} className="text-center space-y-3">
            <h2 className="!leading-[1.1]">Department Leaderboard</h2>
          </motion.div>

          <motion.div variants={fadeUp} className="max-w-4xl mx-auto">
            <div className="card-bezel-elevated glass-premium">
              <div className="card-bezel-inner bg-transparent shadow-none">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 px-6 py-4 text-[10px] uppercase tracking-widest text-[var(--foreground-muted)] font-bold border-b border-[var(--surface-border)]">
                  <div className="col-span-2">Rank</div>
                  <div className="col-span-4">Department</div>
                  <div className="col-span-2 text-right">Total Points</div>
                  <div className="col-span-2 text-right">Participants</div>
                  <div className="col-span-2 text-right">Wins</div>
                </div>

                {/* Rows */}
                {leaderboard.map((dept, i) => (
                  <motion.div
                    key={dept.department}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.06, duration: 0.5, ease: EASE_OUT_EXPO }}
                    className={\`grid grid-cols-12 gap-2 px-6 py-4 items-center border-b border-[var(--surface-border)] last:border-0 transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-[var(--accent-muted)]\`}
                  >
                    <div className="col-span-2">
                      <span className="font-mono font-bold text-xs text-[var(--foreground-muted)] pl-2">{i + 1}</span>
                    </div>
                    <div className="col-span-4 flex items-center gap-2.5 min-w-0">
                      <div className="min-w-0 flex-1">
                        <span className="font-semibold text-sm block truncate">{dept.department}</span>
                        {/* Progress bar */}
                        <div className="progress-bar mt-1.5 hidden sm:block">
                          <div className="progress-bar-fill" style={{ width: \`\${dept.percentage}%\` }} />
                        </div>
                      </div>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="font-mono font-bold text-sm">{dept.points.toLocaleString()}</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="font-mono text-sm text-[var(--foreground-secondary)]">{dept.participants}</span>
                    </div>
                    <div className="col-span-2 text-right">
                      <span className="font-mono text-sm text-[var(--foreground-secondary)]">{dept.wins}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// HOW IT WORKS — Connected Timeline Steps
// ============================================================

function HowItWorks() {
  const steps = [
    { icon: GraduationCap, title: "Log In with RIT ID", description: "Use your college Google or Microsoft login — no new password needed." },
    { icon: MagnifyingGlass, title: "Browse Events", description: "See all open hackathons, symposia, and workshops from all 7 departments in one feed." },
    { icon: Ticket, title: "Grab Your QR Pass", description: "Get a digital entry pass instantly. Flash it at the venue — no printing needed." },
    { icon: ChartLineUp, title: "Earn Branch Points", description: "Every check-in and podium finish adds points to your department's score." },
  ];

  return (
    <section className="py-[var(--space-section)] bg-transparent">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          className="space-y-14"
        >
          <motion.div variants={fadeUp} className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="eyebrow">⚡ Quick Start</span>
            <h2>From Sign-Up to Scoreboard in 4 Steps</h2>
            <p className="text-[var(--foreground-secondary)] mx-auto">Takes less than 2 minutes to get your first event pass.</p>
          </motion.div>

          <motion.div variants={staggerContainer} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {steps.map((step, i) => (
              <motion.div key={step.title} variants={scaleIn} className={\`card-bezel group \${i < 3 ? "timeline-connector" : ""}\`}>
                <div className="card-bezel-inner p-8 space-y-5 text-center bg-transparent shadow-none hover:bg-[var(--accent-muted)]/20 transition-all duration-500">
                  <div className="relative mx-auto">
                    <div className="w-16 h-16 rounded-2xl bg-[var(--accent-muted)] flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-[var(--accent-muted-strong)] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]">
                      <step.icon weight="light" className="w-7 h-7 text-[var(--accent)]" />
                    </div>
                    {/* Step number badge */}
                    <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[var(--cta)] text-white text-[10px] font-bold flex items-center justify-center shadow-sm">
                      {i + 1}
                    </div>
                  </div>
                  <h4 className="font-semibold tracking-tight text-[var(--foreground)]">{step.title}</h4>
                  <p className="text-xs text-[var(--foreground-muted)] leading-relaxed">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// ABOUT SECTION — Clean 3-Column Layout
// ============================================================

function AboutSection() {
  return (
    <section id="about" className="py-[var(--space-section)] border-t border-[var(--surface-border)] bg-transparent">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="card-bezel-elevated glass-premium"
        >
          <div className="card-bezel-inner relative overflow-hidden bg-transparent shadow-none px-8 py-20 sm:px-16 text-center">
            {/* Ambient gradients */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-0 right-0 w-[60%] h-full bg-gradient-to-l from-[var(--accent)]/10 to-transparent" />
              <div className="absolute bottom-0 left-0 w-[40%] h-[60%] bg-gradient-to-tr from-[var(--cta)]/8 to-transparent" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-[var(--accent)]/5 blur-[80px]" />
            </div>

            <div className="relative space-y-16">
              <h2 className="max-w-2xl mx-auto text-4xl">
                What is <span className="gradient-text">Contest Alert?</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                <div className="space-y-3">
                  <h3 className="text-3xl font-display font-bold text-[var(--foreground)] tracking-tight">Discover.</h3>
                  <p className="text-[var(--foreground-secondary)] text-sm">Find every campus event in one place</p>
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-display font-bold text-[var(--foreground)] tracking-tight">Participate.</h3>
                  <p className="text-[var(--foreground-secondary)] text-sm">Register and get your QR pass instantly</p>
                </div>
                <div className="space-y-3">
                  <h3 className="text-3xl font-display font-bold text-[var(--foreground)] tracking-tight">Shine.</h3>
                  <p className="text-[var(--foreground-secondary)] text-sm">Earn points and climb the leaderboard</p>
                </div>
              </div>

              <div className="pt-8">
                <Link
                  href="/login"
                  className="group relative inline-flex items-center gap-3 pl-8 pr-2.5 py-2.5 rounded-full bg-[var(--cta)] text-white font-semibold text-[15px] transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] hover:shadow-[0_0_40px_rgba(255,87,34,0.25)] active:scale-[0.97]"
                >
                  <span>Ready to Rep Your Branch?</span>
                  <span className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center group-hover:translate-x-0.5 group-hover:-translate-y-[1px] group-hover:scale-110 transition-all duration-300">
                    <ArrowRight weight="light" className="w-4 h-4" />
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================
// FOOTER — Premium Minimal
// ============================================================

function Footer() {
  return (
    <footer className="border-t border-[var(--surface-border)] py-14 bg-transparent">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="bg-white dark:bg-white/95 px-2 py-1 rounded-lg border border-neutral-100 shadow-sm flex items-center justify-center shrink-0">
              <img src="/images/logo.png" alt="RIT Logo" className="h-6 w-auto object-contain" />
            </div>
            <span className="text-[var(--surface-border)] font-normal">|</span>
            <span className="font-display font-extrabold text-[13px] tracking-tight block leading-none text-[var(--foreground)]">Contest Alert</span>
          </div>

          <div className="text-center text-xs text-[var(--foreground-muted)] space-y-1.5">
            <p>Affiliated with Anna University · AICTE Approved · Built for RIT Chennai</p>
          </div>

          <div className="flex items-center gap-5 text-sm text-[var(--foreground-muted)]">
            <a href="#" className="hover:text-[var(--foreground)] transition-colors duration-300">Privacy</a>
            <a href="#" className="hover:text-[var(--foreground)] transition-colors duration-300">Terms</a>
            <a href="#" className="hover:text-[var(--foreground)] transition-colors duration-300">Contact</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ============================================================
// MAIN PAGE EXPORT
// ============================================================

export default function LandingPage() {
  return (
    <main className="relative">
      <Navbar />
      <HeroSection />
      <EventsSection />
      <StudentSpotlight />
      <StudentLeaderboardSection />
      <DepartmentLeaderboardSection />
      <HowItWorks />
      <AboutSection />
      <Footer />
    </main>
  );
}
`;

fs.writeFileSync('src/app/page.tsx', content);
