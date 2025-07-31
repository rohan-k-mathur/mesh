"use client";
import { GoogleMap, Marker, HeatmapLayer, useJsApiLoader } from "@react-google-maps/api";
import { useMemo } from "react";
import type { LatLng, Candidate } from "@/packages/halfway-utils/groupAlgorithm";

const libs = ["visualization"] as const;

export type HeatPoint = { lat: number; lng: number; weight: number };

export default function GroupHalfwayMap({
  origins,
  candidates,
  heatData,
}: {
  origins: LatLng[];
  candidates: Candidate[];
  heatData: { points: HeatPoint[] } | null;
}) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries: libs,
  });

  const center = useMemo(() => {
    if (origins.length === 0) return { lat: 0, lng: 0 };
    return origins.reduce(
      (acc, cur) => ({ lat: acc.lat + cur.lat / origins.length, lng: acc.lng + cur.lng / origins.length }),
      { lat: 0, lng: 0 }
    );
  }, [origins]);

  const heatArray = useMemo(() => {
    if (!heatData) return [] as google.maps.visualization.WeightedLocation[];
    return heatData.points.map((p) => ({ location: new google.maps.LatLng(p.lat, p.lng), weight: p.weight }));
  }, [heatData]);

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  if (!isLoaded) return <div className="h-96 w-full bg-gray-200" />;

  return (
    <GoogleMap center={center} zoom={13} mapContainerStyle={{ width: "100%", height: "500px" }}>
      {heatArray.length > 0 && <HeatmapLayer data={heatArray} options={{ radius: 20 }} />}
      {origins.map((o, i) => (
        <Marker key={i} position={o} label={letters[i] || String(i + 1)} />
      ))}
      {candidates.map((c, i) => (
        <Marker key={c.id} position={c.location} label={String(i + 1)} />
      ))}
    </GoogleMap>
  );
}
