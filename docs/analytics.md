# Scroll Analytics

User scroll behaviour is captured client-side and stored in Supabase.
Events are validated and throttled before insert. Realtime is enabled on
`scroll_events` so workers can react immediately.
