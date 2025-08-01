/* app/(standard)/halfway/page.tsx */
"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  useLoadScript,
  GoogleMap,
  Autocomplete,
  Marker,
  Polyline,
  Circle,
  InfoWindow,
  Libraries,
} from "@react-google-maps/api";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { dedupeByPlaceId, Venue } from "@/lib/dedupeVenues";
import { sortByDistance, sortByPrice, sortByRating, haversineDistance, LatLng } from "@/lib/sorters";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
const libraries: Libraries = ["places", "geometry"];

const mapContainerStyle = { width: "100%", height: "400px" };

export default function HalfwayPage() {
  /* ───────────────────────────── state ───────────────────────────── */
  const [map,           setMap]           = useState<google.maps.Map | null>(null);
  const [addrA,         setAddrA]         = useState("");
  const [addrB,         setAddrB]         = useState("");
  const [coordA,        setCoordA]        = useState<LatLng | null>(null);
  const [coordB,        setCoordB]        = useState<LatLng | null>(null);
  const [midpoint,      setMidpoint]      = useState<LatLng | null>(null);
  const [pathA,         setPathA]         = useState<LatLng[]>([]);
  const [pathB,         setPathB]         = useState<LatLng[]>([]);
  const [distA,         setDistA]         = useState<number | null>(null);
  const [distB,         setDistB]         = useState<number | null>(null);
  const [venues,        setVenues]        = useState<Venue[]>([]);
  const [venCat,        setVenCat]        = useState("restaurant");
  const [venFilter,     setVenFilter]     = useState("hours");
  const [sortBy,        setSortBy]        = useState("rating");
  const [radius,        setRadius]        = useState(1500);
  const [loading,       setLoading]       = useState(false);
  const [errorMsg,      setErrorMsg]      = useState<string | null>(null);
  const [selectedVenue, setSelectedVenue] = useState<Venue | null>(null);

  /* ─────────────────────── Google script loader ─────────────────── */
  const { isLoaded } = useLoadScript({ googleMapsApiKey: GOOGLE_MAPS_API_KEY, libraries });
  const acRefA = useRef<google.maps.places.Autocomplete | null>(null);
  const acRefB = useRef<google.maps.places.Autocomplete | null>(null);
   const reqIdRef = useRef(0);
// /* inside handleFindMidpoint, just after aborting the previous one */
// reqIdRef.current += 1;
 const myReq = reqIdRef.current;
 if (myReq !== reqIdRef.current) return; // obsolete request – ignore

  /* ───────────────────── memoised helpers ───────────────────────── */
  const venueCmp = useMemo(() => {
    return sortBy === "price"
      ? sortByPrice
      : sortBy === "distance" && midpoint
      ? sortByDistance(midpoint)
      : sortByRating;
  }, [sortBy, midpoint]);

  const venueFilterFn = useCallback(
    (v: Venue) => (venFilter === "hours" ? v.openNow === true : true),
    [venFilter]
  );

  /* ──────────────────────── helper fns ──────────────────────────── */
  const middleOfPath = (p: LatLng[]) => (p.length ? p[Math.floor(p.length / 2)] : null);

  const geocode = async (addr: string): Promise<LatLng | null> => {
    const res = await fetch(`/api/geocode?address=${encodeURIComponent(addr)}`);
    return res.ok ? res.json() : null;
  };

  /* ──────────────── Autocomplete change handlers ────────────────── */
  const onPlaceChanged =
    (ref: React.RefObject<google.maps.places.Autocomplete>, setAddr: typeof setAddrA, setCoord: typeof setCoordA) =>
    () => {
      const place = ref.current?.getPlace();
      if (place?.geometry?.location) {
        const loc = place.geometry.location;
        setCoord({ lat: loc.lat(), lng: loc.lng() });
        setAddr(place.formatted_address ?? "");
      }
    };

  /* ─────────────── fetch venues around midpoint ─────────────────── */
  const fetchVenues = useCallback(
    async (mid: LatLng) => {
      setLoading(true);
      setErrorMsg(null);
      try {
        const url = `/api/nearbyPlaces?lat=${mid.lat}&lng=${mid.lng}&type=${venCat}&radius=${radius}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const j = await res.json();
        if (!Array.isArray(j.results)) throw new Error("Bad response");

        const list: Venue[] = j.results.map((p: any) => ({
          id: p.place_id,
          name: p.name,
          address: p.vicinity || p.formatted_address,
          location: { lat: p.geometry.location.lat, lng: p.geometry.location.lng },
          rating: p.rating,
          price_level: p.price_level,
          openingHours: p.opening_hours?.weekday_text,
          openNow: p.opening_hours?.open_now ?? null,
          types: p.types,
          distance: haversineDistance(
            { lat: p.geometry.location.lat, lng: p.geometry.location.lng },
            mid
          ),
        }));

        const deduped = dedupeByPlaceId(list).filter(venueFilterFn).sort(venueCmp);
        setVenues(deduped);
      } catch (e) {
        console.error(e);
        setErrorMsg("No venues found.");
      } finally {
        setLoading(false);
      }
    },
    [venueCmp, venueFilterFn, venCat, radius]
  );

  /* ──────────────── midpoint + directions logic ─────────────────── */
  const abortCtl = useRef<AbortController | null>(null);

  const handleFindMidpoint = useCallback(async () => {
    if (abortCtl.current) abortCtl.current.abort();
    abortCtl.current = new AbortController();

    reqIdRef.current += 1;
    const thisReq = reqIdRef.current;

    let A = coordA;
    let B = coordB;

    /* lazy geocode if missing */
    if (!A && addrA) A = await geocode(addrA);
    if (!B && addrB) B = await geocode(addrB);
    if (!A || !B) return setErrorMsg("Enter two valid addresses");

    setCoordA(A);
    setCoordB(B);
    setErrorMsg(null);
    setLoading(true);

    try {
      /* 1️⃣ travel‑time midpoint */
      const url = `/api/computeRoutes?origin=${A.lat},${A.lng}&destination=${B.lat},${B.lng}`;
      const res = await fetch(url, { signal: abortCtl.current.signal });
      const { midpoint: mid, error } = await res.json();
      if (!res.ok || error) throw new Error(error ?? "midpoint fail");

      if (thisReq !== reqIdRef.current) return;   // ← stale; ignore
      setMidpoint(mid);
      /* 2️⃣ decode each half‑route for polylines + distances */
      const fetchRoute = async (start: LatLng) => {
        const r = await fetch(`/api/computeRoutes?origin=${start.lat},${start.lng}&destination=${mid.lat},${mid.lng}`);
        const j = await r.json();
        if (!r.ok || j.error || !j.routes?.[0]) return { path: [], miles: null };

        const encoded = j.routes[0].polyline.encodedPolyline as string;
        const path = google.maps.geometry.encoding.decodePath(encoded).map((p) => ({ lat: p.lat(), lng: p.lng() }));
        const miles = j.routes[0].legs[0].distance.value / 1609.34;
        return { path, miles };
      };

      const [{ path: pA, miles: mA }, { path: pB, miles: mB }] = await Promise.all([
        fetchRoute(A),
        fetchRoute(B),
      ]);

      setPathA(pA);
      setPathB(pB);
      setDistA(mA);
      setDistB(mB);

      /* 3️⃣ venues */
      await fetchVenues(mid);
    } catch (e) {
            if (thisReq !== reqIdRef.current) return;      // stale
            if ((e as any).name !== "AbortError") {
              console.error(e);
              toast.error("Failed to calculate midpoint");
              setErrorMsg("Midpoint calculation failed.");
            }
    } finally {
      if (thisReq === reqIdRef.current) setLoading(false);
    }
  }, [addrA, addrB, coordA, coordB, fetchVenues]);

  /* auto‑refresh venues when filters change */
  useEffect(() => {
    if (midpoint) fetchVenues(midpoint);
  }, [midpoint, venCat, radius, venueFilterFn, venueCmp, fetchVenues]);

  /* ─────────────────────── early skeleton ───────────────────────── */
  if (!isLoaded) return <Skeleton className="w-full h-[400px] rounded-md" />;

  /* ─────────────────────────── render ───────────────────────────── */
  return (
    <div className="space-y-4">
      {/* ─────────────── input row ─────────────── */}
      <div className="flex justify-center align-center items-center xs:flex-row xs:space-x-4 space-y-2 xs:space-y-0">
        <Autocomplete           className="w-full h-full  searchfield bg-opacity-50 rounded-xl "
 onLoad={(a) => (acRefA.current = a)} onPlaceChanged={onPlaceChanged(acRefA, setAddrA, setCoordA)}>
          <Input className="w-full h-full  searchfield  bg-white bg-opacity-50 rounded-xl focus:bg-opacity-50  focus:ring-blue focus:ring-[1px]" placeholder="Address A" value={addrA} onChange={(e) => setAddrA(e.target.value)} />
        </Autocomplete>
        <Autocomplete  className="w-full h-full  searchfield bg-opacity-50 rounded-xl " onLoad={(a) => (acRefB.current = a)} onPlaceChanged={onPlaceChanged(acRefB, setAddrB, setCoordB)}>
          <Input className="w-full h-full  searchfield  bg-white bg-opacity-50 rounded-xl  focus:ring-blue focus:ring-[1px]"  placeholder="Address B" value={addrB} onChange={(e) => setAddrB(e.target.value)} />
        </Autocomplete>
        <button disabled={loading || !addrA || !addrB} onClick={handleFindMidpoint} 
         className=" likebutton h-fit w-fit  bg-white bg-opacity-50 py-1 px-3 rounded-xl">
          {loading ? "Finding" : "Halfway"}
        </button>
      </div>

      {errorMsg && <p className="text-red-500">{errorMsg}</p>}

      {/* ─────────────── map ─────────────── */}
      {midpoint && (
        <div className="relative">
          <GoogleMap
            center={midpoint}
            zoom={12}
            mapContainerStyle={mapContainerStyle}
            onLoad={(m) => setMap(m)}
          >
            {coordA && <Marker position={coordA} label="A" />}
            {coordB && <Marker position={coordB} label="B" />}
            <Marker position={midpoint} label="★" />

            {pathA.length > 0 && <Polyline path={pathA} options={{ strokeColor: "green" }} />}
            {pathB.length > 0 && <Polyline path={pathB} options={{ strokeColor: "blue" }} />}

            {distA && middleOfPath(pathA) && (
              <Marker
                position={middleOfPath(pathA)!}
                icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 0 }}
                label={{ text: `${distA.toFixed(1)} mi`, fontSize: "12px" }}
              />
            )}
            {distB && middleOfPath(pathB) && (
              <Marker
                position={middleOfPath(pathB)!}
                icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 0 }}
                label={{ text: `${distB.toFixed(1)} mi`, fontSize: "12px" }}
              />
            )}

            {map && (
              <Circle
                center={midpoint}
                radius={radius}
                options={{ fillColor: "#AAF", fillOpacity: 0.2, strokeColor: "#00F", strokeWeight: 0.5 }}
              />
            )}

            {venues.map((v) => (
              <Marker key={v.id} position={v.location} onClick={() => setSelectedVenue(v)} />
            ))}

            {selectedVenue && (
              <InfoWindow position={selectedVenue.location} onCloseClick={() => setSelectedVenue(null)}>
                <div className="text-sm space-y-1">
                  <p className="font-semibold">{selectedVenue.name}</p>
                  {selectedVenue.rating && <p>Rating: {selectedVenue.rating}</p>}
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedVenue.name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    View on Maps
                  </a>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>

          <div className="absolute bottom-2 right-2 bg-white/80 text-xs p-2 rounded">
            <p>A = you</p>
            <p>B = friend</p>
            <p>★ = travel‑time midpoint</p>
          </div>
        </div>
      )}

      {/* ─────────────── controls ─────────────── */}
      {midpoint && (
        <>
          <div className="flex flex-col  w-full h-full sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
            {/* <div className="likebutton bg-white/50 p-4 grow">
              <label>Radius: {radius} m</label>
              <Slider min={500} max={5000} step={100} value={[radius]} onValueChange={([v]) => setRadius(v)} />
            </div> */}
             <div className="flex flex-col w-full h-full space-y-4 items-center ">
      <div             className="likebutton bg-white bg-opacity-50 px-4 py-4 w-full h-full">
          <label className="block text-[1rem] px-2 py-1">Radius: {radius} m</label>
          <Slider
            value={[radius]}
            min={500}
            max={5000}
            step={100}
            className="py-1"
            onValueChange={(value) => setRadius(value[0])}
          />
          
        </div>
        <div className="flex w-full  h-full space-x-4  items-center">

            <Select value={venCat} onValueChange={setVenCat}>
              <SelectTrigger className="likebutton bg-white/50 px-4 py-2 grow">
                <SelectValue placeholder="Venue type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="restaurant">Restaurant</SelectItem>
                <SelectItem value="cafe">Cafe</SelectItem>
                <SelectItem value="park">Park</SelectItem>
              </SelectContent>
            </Select>

            <Select value={venFilter} onValueChange={setVenFilter}>
              <SelectTrigger className="likebutton bg-white/50 px-4 py-2 grow">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hours">Open now</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="likebutton bg-white/50 px-4 py-2 grow">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="distance">Distance</SelectItem>
              </SelectContent>
            </Select>
            </div>

          </div>
            </div>
          {/* ───────────── venue cards ───────────── */}
          {venues.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4" aria-live="polite">
              {venues.map((v) => (
                <Card key={v.id} className="likebutton bg-white/40">
                  <CardHeader>
                    <CardTitle>{v.name}</CardTitle>
                    <CardDescription>{v.address}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-1 text-sm">
                    {v.rating && <p>Rating: {v.rating} / 5</p>}
                    {v.openingHours && v.openingHours.map((l, i) => <p key={i}>{l}</p>)}
                    {distA !== null && distB !== null && (
                      <>
                        <p>A → ★ {distA.toFixed(1)} mi</p>
                        <p>B → ★ {distB.toFixed(1)} mi</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
