export const BACKEND = {
  url: (import.meta.env.VITE_SUPABASE_URL as string) || 'https://fhamgdtnxssmmsdfalum.supabase.co',
  // Öffentlicher anon key (steckt identisch im Frontend von metropol-bz.de); Zugriff regelt RLS.
  key:
    (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZoYW1nZHRueHNzbW1zZGZhbHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjg2NDQsImV4cCI6MjA4NTY0NDY0NH0.TTjyv5n2JxcwVTFzTNPBlEy-ZfxClEmQSoOgtwasjis',
}
