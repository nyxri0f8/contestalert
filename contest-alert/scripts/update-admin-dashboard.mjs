import fs from 'fs';

let content = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

// 1. Add Realtime Subscription
const useEffectMarker = `    }
    loadAdminData();
  }, []);`;
const realtimeCode = `    }
    loadAdminData();

    const supabase = createClient();
    const channel = supabase
      .channel('admin_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => loadAdminData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'registrations' }, () => loadAdminData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);`;
content = content.replace(useEffectMarker, realtimeCode);

// 2. Add VLSI & CSBS to Heatmap Data Generation
const heatmapMarker = `const depts = ["CSE", "ECE", "AIML", "AIDS", "CCE", "Biotechnology", "Mechanical"];`;
const newHeatmapMarker = `const depts = ["CSE", "ECE", "AIML", "AIDS", "CCE", "Biotechnology", "Mechanical", "VLSI", "CSBS"];`;
content = content.replace(heatmapMarker, newHeatmapMarker);

// 3. Add VLSI & CSBS to Heatmap Header
const heatmapHeaderMarker = `<div className="font-bold text-[var(--foreground-secondary)]">ME</div>`;
const newHeatmapHeaderMarker = `<div className="font-bold text-[var(--foreground-secondary)]">ME</div>
                  <div className="font-bold text-[var(--foreground-secondary)]">VLSI</div>
                  <div className="font-bold text-[var(--foreground-secondary)]">CSBS</div>`;
content = content.replace(heatmapHeaderMarker, newHeatmapHeaderMarker);

// 4. Add VLSI & CSBS to Heatmap Row
const heatmapRowMarker = `<div className={\`p-2.5 rounded-lg \${getHeatmapColor(row.ME)}\`}>{row.ME}</div>`;
const newHeatmapRowMarker = `<div className={\`p-2.5 rounded-lg \${getHeatmapColor(row.ME)}\`}>{row.ME}</div>
                      <div className={\`p-2.5 rounded-lg \${getHeatmapColor(row.VLSI)}\`}>{row.VLSI}</div>
                      <div className={\`p-2.5 rounded-lg \${getHeatmapColor(row.CSBS)}\`}>{row.CSBS}</div>`;
content = content.replace(heatmapRowMarker, newHeatmapRowMarker);

// 5. Update Heatmap grid-cols
const gridColsMarker = `grid-cols-8 gap-2.5 text-center text-xs`;
const newGridColsMarker = `grid-cols-[1.5fr_repeat(9,1fr)] gap-2.5 text-center text-xs`;
content = content.replace(gridColsMarker, newGridColsMarker);

fs.writeFileSync('src/app/admin/page.tsx', content);
console.log('Admin Dashboard updated for realtime and new departments.');
