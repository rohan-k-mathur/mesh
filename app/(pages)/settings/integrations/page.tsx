// app/(pages)/settings/integrations/page.tsx
import SpotifyButton from './SpotifyButton';

export const metadata = { title: 'Integrations' };

export default function IntegrationsPage() {
  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Integrations</h1>

      {/* --- Spotify -------------------------------------------------- */}
      <section className="space-y-2">
        <h2 className="text-xl font-medium flex items-center gap-2">
          <img src="/logo/spotify.svg" className="h-5 w-5" /> Spotify
        </h2>
        <p className="text-sm text-gray-500">
          Import your liked songs to personalise recommendations.
        </p>
        <SpotifyButton />
      </section>
    </main>
  );
}
