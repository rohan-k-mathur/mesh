// app/(pages)/settings/integrations/page.tsx
import SpotifyButton from "./SpotifyButton";
import Image from "next/image";

export const metadata = { title: 'Integrations' };

export default function IntegrationsPage() {
  return (
    <main className="p-8 space-y-6">
      <h1 className="text-2xl font-semibold">Integrations</h1>

      {/* --- Spotify -------------------------------------------------- */}
      <section className="space-y-2">
        <h2 className="text-xl font-medium flex items-center gap-2">
          <Image src="/logo/spotify.svg" alt="Spotify" width={20} height={20} /> Spotify
        </h2>
        <p className="text-sm text-gray-500">
          Import your liked songs to personalise recommendations.
        </p>
        <SpotifyButton />
      </section>
    </main>
  );
}
