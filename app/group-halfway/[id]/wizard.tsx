"use client";
import { useState, useEffect, useRef } from "react";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const libraries = ["places"] as const;

export default function OriginWizard({
  meetingId,
  token,
  currentUid,
  participantUids,
  initialOrigins,
}: {
  meetingId: string;
  token: string;
  currentUid: string;
  participantUids: string[];
  initialOrigins: Record<string, any>;
}) {
  const [origins, setOrigins] = useState<Record<string, any>>(initialOrigins);
  const [address, setAddress] = useState("");
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  });

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(`/api/group-halfway/info/${meetingId}?token=${token}`);
      if (res.ok) {
        const data = await res.json();
        setOrigins(data.origins || {});
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [meetingId, token]);

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (place?.geometry?.location) {
      setAddress(place.formatted_address || "");
      const loc = place.geometry.location;
      fetch(`/api/group-halfway/origins/${meetingId}?token=${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: place.formatted_address, lat: loc.lat(), lng: loc.lng() }),
      }).then(() => {
        setOrigins((o) => ({ ...o, [currentUid]: { address: place.formatted_address } }));
      });
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
  };

  const allSet = participantUids.every((uid) => origins[uid]);

  return (
    <div className="space-y-4">
      {!origins[currentUid] && isLoaded && (
        <Autocomplete onLoad={(a) => (autocompleteRef.current = a)} onPlaceChanged={handlePlaceChanged}>
          <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Enter your start address" />
        </Autocomplete>
      )}
      <Button onClick={copyLink}>Copy invite link</Button>
      <div>
        <h2 className="font-bold">Participants</h2>
        <ul>
          {participantUids.map((uid) => (
            <li key={uid} className="flex items-center space-x-2">
              <span>{uid}</span>
              <span>{origins[uid] ? "✅" : "❌"}</span>
            </li>
          ))}
        </ul>
        {allSet && <p>All set!</p>}
      </div>
    </div>
  );
}
