import { createClient } from "./client";

export async function getEventImageUrls(events: any[]) {
  const supabase = createClient();
  
  return events.map(e => {
    if (e.cover_image_path) {
      const { data } = supabase.storage
        .from("event-covers")
        .getPublicUrl(e.cover_image_path);
      return { ...e, cover_image: data.publicUrl };
    }
    return e;
  });
}
