import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const isValid = url && url.startsWith('http') && url !== 'your_supabase_project_url';

  return createBrowserClient(
    isValid ? url : 'https://placeholder.supabase.co',
    isValid ? key! : 'placeholder-key'
  );
}
