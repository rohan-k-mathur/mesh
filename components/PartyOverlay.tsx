import { usePartyPresence } from "@/lib/hooks/usePartyPresence";

export default function PartyOverlay({ partyId }: { partyId: string }) {
  const curs = usePartyPresence(partyId);
  return (
    <>
      {curs.map((c) => (
        <div
          key={c.userId}
          className="absolute w-4 h-4 rounded-full pointer-events-none"
          style={{
            left: `${c.x}%`,
            top: `${c.y}%`,
            backgroundColor: `hsl(${BigInt(c.userId) % 360n}deg 70% 50%)`,
          }}
        />
      ))}
    </>
  );
}
