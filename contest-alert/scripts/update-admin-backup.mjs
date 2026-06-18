import fs from 'fs';

let content = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

// 1. Add imports for XLSX and WarningIcon
const importMarker = 'import { Sidebar } from "@/components/shared/Sidebar";';
const importReplacement = `import { Sidebar } from "@/components/shared/Sidebar";
import * as XLSX from "xlsx";
import { Warning, DownloadSimple } from "@phosphor-icons/react";`;
content = content.replace(importMarker, importReplacement);

// 2. Add state for eventsNeedingBackup and downloading state
const stateMarker = '  const [heatmapData, setHeatmapData] = useState<any[]>([]);';
const stateReplacement = `  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [eventsNeedingBackup, setEventsNeedingBackup] = useState<any[]>([]);
  const [downloadingBackup, setDownloadingBackup] = useState(false);`;
content = content.replace(stateMarker, stateReplacement);

// 3. Update loadAdminData to fetch events needing backup
const loadMarker = `        // 4. Fetch Recent Registrations`;
const backupLogic = `        // Fetch events needing backup (deadline within 7 days)
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        
        const { data: backupEvents } = await supabase
          .from("events")
          .select("id, title, deadline")
          .eq("status", "active")
          .eq("is_backed_up", false)
          .lte("deadline", sevenDaysFromNow.toISOString())
          .gte("deadline", new Date().toISOString());
        
        setEventsNeedingBackup(backupEvents || []);

        // 4. Fetch Recent Registrations`;
content = content.replace(loadMarker, backupLogic);

// 4. Add downloadBackup function
const funcMarker = `  const getHeatmapColor = (value: number) => {`;
const downloadFunc = `  const downloadBackup = async () => {
    if (eventsNeedingBackup.length === 0) return;
    setDownloadingBackup(true);
    try {
      const supabase = createClient();
      const wb = XLSX.utils.book_new();
      
      let totalRegs = 0;
      let totalAttendance = 0;
      let deptCounts: Record<string, number> = {};

      for (const event of eventsNeedingBackup) {
        // Fetch registrations with profiles and attendance
        const { data: regs } = await supabase
          .from("registrations")
          .select(\`
            registered_at, team_name,
            profiles(name, register_number, department, year, section),
            attendance(checked_in_at)
          \`)
          .eq("event_id", event.id);

        if (regs && regs.length > 0) {
          totalRegs += regs.length;
          
          const sheetData = regs.map(r => {
            const p = (r.profiles as any) || {};
            const att = r.attendance as any;
            if (att) totalAttendance++;
            if (p.department) {
              deptCounts[p.department] = (deptCounts[p.department] || 0) + 1;
            }

            return {
              "Student Name": p.name || "Unknown",
              "Roll Number": p.register_number || "-",
              "Department": p.department || "-",
              "Year": p.year || "-",
              "Section": p.section || "-",
              "Team Name": r.team_name || "-",
              "Registration Date": new Date(r.registered_at).toLocaleString(),
              "Attended": att ? "Yes" : "No",
              "Check-in Time": att ? new Date(att.checked_in_at).toLocaleString() : "-"
            };
          });

          const ws = XLSX.utils.json_to_sheet(sheetData);
          // Sheet names must be <= 31 chars
          XLSX.utils.book_append_sheet(wb, ws, event.title.substring(0, 31));
        } else {
          // Empty sheet if no regs
          const ws = XLSX.utils.json_to_sheet([{ Message: "No registrations yet" }]);
          XLSX.utils.book_append_sheet(wb, ws, event.title.substring(0, 31));
        }
      }

      // Final Sheet: Overall Stats
      let topDept = "-";
      let maxCount = 0;
      Object.entries(deptCounts).forEach(([dept, count]) => {
        if (count > maxCount) {
          maxCount = count;
          topDept = dept;
        }
      });

      const statsData = [
        { Metric: "Total Registrations (These Events)", Value: totalRegs },
        { Metric: "Average Attendance %", Value: totalRegs > 0 ? ((totalAttendance / totalRegs) * 100).toFixed(1) + "%" : "0%" },
        { Metric: "Departments Participated", Value: Object.keys(deptCounts).length },
        { Metric: "Top Department", Value: \`\${topDept} (\${maxCount} regs)\` }
      ];
      
      const statsWs = XLSX.utils.json_to_sheet(statsData);
      XLSX.utils.book_append_sheet(wb, statsWs, "Overall Stats");

      // Download file
      XLSX.writeFile(wb, \`ContestAlert_Backup_\${new Date().toISOString().split('T')[0]}.xlsx\`);

      // Mark as backed up in DB
      const eventIds = eventsNeedingBackup.map(e => e.id);
      await supabase.from("events").update({ is_backed_up: true }).in("id", eventIds);
      
      // Dismiss banner
      setEventsNeedingBackup([]);
      
    } catch (err) {
      console.error("Backup failed", err);
      alert("Failed to generate backup.");
    } finally {
      setDownloadingBackup(false);
    }
  };

  const getHeatmapColor = (value: number) => {`;
content = content.replace(funcMarker, downloadFunc);

// 5. Add Banner in UI
const uiMarker = '{/* Content */}';
const uiBanner = `{/* Content */}
        {eventsNeedingBackup.length > 0 && (
          <div className="bg-red-500/10 border-b border-red-500/20 px-6 lg:px-8 py-3 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-[69px] z-10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center shrink-0">
                <Warning weight="bold" className="w-4 h-4 text-red-500" />
              </div>
              <div>
                <div className="text-sm font-bold text-red-500">Action Required: Event Backups Pending</div>
                <div className="text-[10px] text-red-500/80 font-medium">
                  {eventsNeedingBackup.length} event(s) have deadlines within 7 days and haven't been backed up.
                </div>
              </div>
            </div>
            <button
              onClick={downloadBackup}
              disabled={downloadingBackup}
              className="shrink-0 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-2 shadow-[var(--shadow-glow)] disabled:opacity-50"
            >
              <DownloadSimple weight="bold" className="w-4 h-4" />
              {downloadingBackup ? "Generating Backup..." : "Download XLSX Backup"}
            </button>
          </div>
        )}`;
content = content.replace(uiMarker, uiBanner);

fs.writeFileSync('src/app/admin/page.tsx', content);
console.log('Admin Dashboard updated for Backup generation');
