import fs from 'fs';

// --- Update Leaderboard Page ---
let leaderboard = fs.readFileSync('src/app/leaderboard/page.tsx', 'utf8');

// 1. Remove heatmap state
leaderboard = leaderboard.replace('  const [heatmapData, setHeatmapData] = useState<any[]>([]);\n', '');

// 2. Remove heatmap data generation
const heatmapDataGenStart = leaderboard.indexOf('          const categories = ["hackathon", "workshop", "symposium", "placement", "sports", "cultural"];');
const heatmapDataGenEnd = leaderboard.indexOf('          const weeklyMap: Record<string, Record<string, number>> = {');
if (heatmapDataGenStart !== -1 && heatmapDataGenEnd !== -1) {
  leaderboard = leaderboard.slice(0, heatmapDataGenStart) + leaderboard.slice(heatmapDataGenEnd);
}

// 3. Remove getHeatmapColor
const getHeatmapColorStart = leaderboard.indexOf('  // Heatmap block color intensity generator');
const getHeatmapColorEnd = leaderboard.indexOf('  return (');
if (getHeatmapColorStart !== -1 && getHeatmapColorEnd !== -1) {
  leaderboard = leaderboard.slice(0, getHeatmapColorStart) + leaderboard.slice(getHeatmapColorEnd);
}

// 4. Remove heatmap JSX
const heatmapJsxStart = leaderboard.indexOf('          {/* Department Heatmap Matrix */}');
const heatmapJsxEnd = leaderboard.indexOf('        </div>\n      </main>');
if (heatmapJsxStart !== -1 && heatmapJsxEnd !== -1) {
  leaderboard = leaderboard.slice(0, heatmapJsxStart) + leaderboard.slice(heatmapJsxEnd);
}

fs.writeFileSync('src/app/leaderboard/page.tsx', leaderboard);


// --- Update Admin Page ---
let admin = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

// 1. Add Fire icon import
if (!admin.includes('Fire,')) {
  admin = admin.replace('  Sparkle,\n', '  Sparkle,\n  Fire,\n');
}
if (!admin.includes('import React')) {
  admin = admin.replace('import { useState, useEffect } from "react";', 'import React, { useState, useEffect } from "react";');
}

// 2. Add heatmapData state
admin = admin.replace('  const [recentRegs, setRecentRegs] = useState<any[]>([]);\n', '  const [recentRegs, setRecentRegs] = useState<any[]>([]);\n  const [heatmapData, setHeatmapData] = useState<any[]>([]);\n');

// 3. Add heatmapData generation in loadAdminData
const fetchRecentRegsIndex = admin.indexOf('        // 4. Fetch Recent Registrations');
if (fetchRecentRegsIndex !== -1) {
  const heatmapDataGen = `        // Heatmap Data Generation
        const { data: allRegs } = await supabase.from("registrations").select(\`
            registered_at,
            profiles(department),
            events(category)
          \`);

        if (allRegs) {
          const categories = ["hackathon", "workshop", "symposium", "placement", "sports", "cultural"];
          const depts = ["CSE", "ECE", "AIML", "AIDS", "CCE", "Biotechnology", "Mechanical"];
          const categoryLabels: Record<string, string> = {
            hackathon: "Hackathons",
            workshop: "Workshops",
            symposium: "Symposiums",
            placement: "Placements",
            sports: "Sports",
            cultural: "Culturals",
          };

          const heatmap = categories.map((cat) => {
            const row: any = { category: categoryLabels[cat] || cat };
            depts.forEach((d) => {
              const count = allRegs.filter((r: any) => {
                const profile: any = Array.isArray(r.profiles) ? r.profiles[0] : r.profiles;
                const event: any = Array.isArray(r.events) ? r.events[0] : r.events;
                return profile?.department === d && event?.category === cat;
              }).length;
              const cellKey = d === "Biotechnology" ? "BT" : d === "Mechanical" ? "ME" : d;
              row[cellKey] = count;
            });
            return row;
          });
          setHeatmapData(heatmap);
        }

`;
  admin = admin.slice(0, fetchRecentRegsIndex) + heatmapDataGen + admin.slice(fetchRecentRegsIndex);
}

// 4. Add getHeatmapColor function before return
const returnIndex = admin.indexOf('  return (\n');
if (returnIndex !== -1) {
  const getHeatmapColor = `  const getHeatmapColor = (value: number) => {
    if (value === 0) return "bg-[var(--surface)]";
    if (value <= 3) return "bg-[var(--accent)]/10 text-[var(--accent)]";
    if (value <= 6) return "bg-[var(--accent)]/30 text-[var(--accent)]";
    if (value <= 8) return "bg-[var(--accent)]/60 text-white";
    return "bg-[var(--accent)] text-black font-bold";
  };

`;
  admin = admin.slice(0, returnIndex) + getHeatmapColor + admin.slice(returnIndex);
}

// 5. Add heatmap JSX at the end of the content area
const contentEndIndex = admin.indexOf('        </div>\n      </main>');
if (contentEndIndex !== -1) {
  const heatmapJsx = `
          {/* Department Heatmap Matrix */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-1.5">
              <Fire weight="light" className="text-amber-500 w-4 h-4" /> Category Heatmap (Engagement Index)
            </h3>
            <div className="card-bezel overflow-hidden">
              <div className="card-bezel-inner overflow-x-auto p-6">
                <div className="min-w-[500px] grid grid-cols-8 gap-2.5 text-center text-xs">
                  <div className="font-semibold text-left text-[var(--foreground-secondary)] flex items-center">
                    Category
                  </div>
                  <div className="font-bold text-[var(--foreground-secondary)]">CSE</div>
                  <div className="font-bold text-[var(--foreground-secondary)]">ECE</div>
                  <div className="font-bold text-[var(--foreground-secondary)]">AIML</div>
                  <div className="font-bold text-[var(--foreground-secondary)]">AIDS</div>
                  <div className="font-bold text-[var(--foreground-secondary)]">CCE</div>
                  <div className="font-bold text-[var(--foreground-secondary)]">BT</div>
                  <div className="font-bold text-[var(--foreground-secondary)]">ME</div>

                  {heatmapData.map((row) => (
                    <React.Fragment key={row.category}>
                      <div className="font-medium text-left py-2 border-b border-[var(--surface-border)] flex items-center text-[var(--foreground-muted)]">
                        {row.category}
                      </div>
                      <div className={\`p-2.5 rounded-lg \${getHeatmapColor(row.CSE)}\`}>{row.CSE}</div>
                      <div className={\`p-2.5 rounded-lg \${getHeatmapColor(row.ECE)}\`}>{row.ECE}</div>
                      <div className={\`p-2.5 rounded-lg \${getHeatmapColor(row.AIML)}\`}>{row.AIML}</div>
                      <div className={\`p-2.5 rounded-lg \${getHeatmapColor(row.AIDS)}\`}>{row.AIDS}</div>
                      <div className={\`p-2.5 rounded-lg \${getHeatmapColor(row.CCE)}\`}>{row.CCE}</div>
                      <div className={\`p-2.5 rounded-lg \${getHeatmapColor(row.BT)}\`}>{row.BT}</div>
                      <div className={\`p-2.5 rounded-lg \${getHeatmapColor(row.ME)}\`}>{row.ME}</div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
`;
  admin = admin.slice(0, contentEndIndex) + heatmapJsx + admin.slice(contentEndIndex);
}

fs.writeFileSync('src/app/admin/page.tsx', admin);

console.log("Migration complete");
