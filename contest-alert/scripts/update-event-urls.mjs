import fs from 'fs';

function patchFile(filepath) {
  let content = fs.readFileSync(filepath, 'utf8');

  // Add import if missing
  if (!content.includes('getEventImageUrls')) {
    // find a good place to inject
    const clientImport = 'import { createClient } from "@/lib/supabase/client";';
    if (content.includes(clientImport)) {
      content = content.replace(clientImport, clientImport + '\nimport { getEventImageUrls } from "@/lib/supabase/storage";');
    }
  }

  // 1. Array of events (e.g., page.tsx, events/page.tsx, admin/events/page.tsx)
  const arrayMarkers = [
    '      const { data, error } = await supabase.from("events").select("*, registrations(count)").eq("status", "active");',
    '      const { data, error } = await supabase.from("events").select("*, registrations(count)");'
  ];

  arrayMarkers.forEach(marker => {
    if (content.includes(marker)) {
      const repl = marker + '\\n      const eventsWithImages = data ? await getEventImageUrls(data) : null;';
      content = content.replace(marker, repl);
      
      // replace `data.map` or `data?.map` with `eventsWithImages`
      content = content.replace(/if \\(data\\) \\{/g, 'if (eventsWithImages) {\\n        const data = eventsWithImages;');
    }
  });

  // 2. Single event (events/[id]/page.tsx)
  const singleMarker = '.single();';
  if (content.includes(singleMarker) && filepath.includes('[id]')) {
    // If it's single event fetch
    const fetchBlock = `        const { data: dbEvent, error } = await supabase
          .from("events")
          .select("*, registrations(count)")
          .eq("id", id)
          .single();`;
    
    if (content.includes(fetchBlock)) {
      const repl = fetchBlock + '\\n        const [eventWithImage] = dbEvent ? await getEventImageUrls([dbEvent]) : [null];\\n        const finalDbEvent = eventWithImage || dbEvent;';
      content = content.replace(fetchBlock, repl);
      
      // replace dbEvent.cover_image with finalDbEvent.cover_image
      content = content.replace(/dbEvent\\.cover_image/g, 'finalDbEvent.cover_image');
      content = content.replace(/dbEvent\\.capacity/g, 'finalDbEvent.capacity');
    }
  }

  fs.writeFileSync(filepath, content);
}

['src/app/page.tsx', 'src/app/events/page.tsx', 'src/app/admin/events/page.tsx', 'src/app/events/[id]/page.tsx'].forEach(file => {
  try {
    patchFile(file);
    console.log("Patched", file);
  } catch (e) {
    console.log("Failed to patch", file, e.message);
  }
});
