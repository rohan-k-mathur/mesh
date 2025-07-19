import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { randomUUID }   from 'node:crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } },
);

// --- A. generate N pseudo tracks ------------------------------------
const N = 200;                       // favourites per user
function fakeTrack(i: number) {
  const id = randomUUID().replace(/-/g,'').slice(0,22);          // looks like a Spotify id
  return {
    added_at: new Date().toISOString(),
    track: {
      id,
      name:  `Fake Song ${i}`,
      artists: [{ name: `Artist ${(i%10)+1}` }],
      album:   { release_date: `${1990 + (i%35)}-01-01` },
    },
  };
}
function buildArray() {
  return Array.from({ length: N }, (_, i) => fakeTrack(i));
}

// --- B. upload into storage -----------------------------------------
async function main(uid: number) {
  const body   = JSON.stringify(buildArray(), null, 2);
  const fname  = `${Date.now()}.json`;
  const key    = `spotify/${uid}/${fname}`;

  const { error } = await supabase
    .storage.from('favorites-raw')
    .upload(key, body, { contentType: 'application/json', upsert: true });

  if (error) throw error;
  console.log('✅  uploaded', key);
}

main(Number(process.argv[2] ?? '1')).catch(console.error);
