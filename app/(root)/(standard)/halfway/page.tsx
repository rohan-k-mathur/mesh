"use client";
import { useState, useRef, useEffect } from "react";
import {
  useLoadScript,
  GoogleMap,
  Marker,
  Circle,
  Autocomplete,
  Libraries,
  Polyline,
} from "@react-google-maps/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const libraries: Libraries = ["places", "geometry"];
const mapContainerStyle = { width: "100%", height: "400px" };

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

type LatLng = { lat: number; lng: number };

type Venue = {
  id: string;
  name: string;
  address: string;
  location: LatLng;
  rating?: number;
  openingHours?: string[];
  types?: string[];
};

type CircleItemRef = React.MutableRefObject<
  { instance: google.maps.Circle; id: string }[]
>;

const CircleComponent = ({
  map,
  midpoint,
  radius,
  options,
}: {
  map: google.maps.Map;
  midpoint: LatLng;
  radius: number;
  options?: google.maps.CircleOptions;
}) => {
  const circleRef = useRef<google.maps.Circle | null>(null);

  useEffect(() => {
    if (!map || !midpoint) return;

    // Clear existing circle before creating a new one
    if (circleRef.current) {
      circleRef.current.setMap(null);
    }

    // Create a new circle
    circleRef.current = new window.google.maps.Circle({
      map,
      center: midpoint,
      radius,
      ...options,
    });

    // Cleanup function to remove the circle on unmount
    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
      }
    };
  }, [map, midpoint, radius, options]);

  return null; // Circle rendered by Google Maps API directly
};

export default function HalfwayPage() {
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [coord1, setCoord1] = useState<LatLng | null>(null);
  const [coord2, setCoord2] = useState<LatLng | null>(null);
  const [midpoint, setMidpoint] = useState<LatLng | null>(null);
  const [avgMidpoint, setAvgMidpoint] = useState<LatLng | null>(null);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [venueType, setVenueType] = useState("restaurant");
  const [radius, setRadius] = useState(1500);
  const [error, setError] = useState<string | null>(null);
  const [path1, setPath1] = useState<LatLng[]>([]);
  const [path2, setPath2] = useState<LatLng[]>([]);
  const [avgPath1, setAvgPath1] = useState<LatLng[]>([]);
  const [avgPath2, setAvgPath2] = useState<LatLng[]>([]);

    // NEW — distance along each route in miles
    const [distance1, setDistance1] = useState<number | null>(null);
    const [distance2, setDistance2] = useState<number | null>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries,
  });
  const circleRefs = useRef<{ instance: google.maps.Circle; id: string }[]>([]);
  const autocompleteRef1 = useRef<google.maps.places.Autocomplete | null>(null);
  const autocompleteRef2 = useRef<google.maps.places.Autocomplete | null>(null);

  // Handle user selecting a place from Autocomplete
  const handlePlaceChanged = (
    ref: React.RefObject<google.maps.places.Autocomplete>,
    setAddress: (addr: string) => void,
    setCoord: (coord: LatLng | null) => void
  ) => {
    const place = ref.current?.getPlace();
    if (place?.geometry?.location) {
      const location = place.geometry.location;
      const coord = { lat: location.lat(), lng: location.lng() };
      console.log("Selected place:", place.formatted_address, coord);
      setCoord(coord);
      setAddress(place.formatted_address || "");
    }
  };

  // Fetch nearby venues from your endpoint
  const fetchVenues = async (mid: LatLng, rad: number, type: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/nearbyPlaces?lat=${mid.lat}&lng=${mid.lng}&type=${type}&radius=${rad}`
      );
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      if (data && Array.isArray(data.results)) {
        const newVenues: Venue[] = data.results
          .map((place: any) => ({
            id: place.place_id,
            name: place.name,
            address: place.vicinity || place.formatted_address,
            location: {
              lat: place.geometry.location.lat,
              lng: place.geometry.location.lng,
            },
            rating: place.rating,
            openingHours: place.opening_hours?.weekday_text,
            types: place.types,
          }))
          .sort((a: Venue, b: Venue) => (b.rating ?? 0) - (a.rating ?? 0));
        setVenues(newVenues);
        console.log("Venues within radius:", newVenues);
      } else {
        setVenues([]);
        setError("No venues found.");
      }
    } catch (error) {
      console.error("Error fetching venues:", error);
      setError("Failed to fetch venues. Check the console.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate midpoint and fetch venues
  const handleFindMidpoint = async () => {
    if (!coord1 || !coord2) {
      setError("Please enter both addresses correctly.");
      return;
    }
    setError(null);
    // Calculate simple geometric midpoint
    const avg = {
      lat: (coord1.lat + coord2.lat) / 2,
      lng: (coord1.lng + coord2.lng) / 2,
    };
    console.log("Average midpoint:", avg);
    setAvgMidpoint(avg);

    try {
      const res = await fetch(
        `/api/routeMidpoint?lat1=${coord1.lat}&lng1=${coord1.lng}&lat2=${coord2.lat}&lng2=${coord2.lng}`
      );
      if (!res.ok) throw new Error("Failed to fetch midpoint");
      const mid: LatLng = await res.json();
      console.log("Route midpoint:", mid);
      setMidpoint(mid);

      // Immediately fetch venues for the current radius & type
      await fetchVenues(mid, radius, venueType);
    } catch (err) {
      console.error("Error fetching midpoint:", err);
      setError("Failed to calculate midpoint.");
    }
  };

  // Auto-refetch when radius or venueType changes (if we have a midpoint)
  useEffect(() => {
    if (midpoint) {
      fetchVenues(midpoint, radius, venueType);
    }
  }, [midpoint, radius, venueType]);

  const fetchRoute = async (start: LatLng, end: LatLng) => {
    try {
      const res = await fetch(
        `/api/computeRoutes?origin=${start.lat},${start.lng}&destination=${end.lat},${end.lng}`
      );
      if (!res.ok) return [] as LatLng[];
      const data = await res.json();
      if (data.routes && data.routes[0]) {
        const encoded = data.routes[0].polyline.encodedPolyline as string;
        return window.google.maps.geometry.encoding
          .decodePath(encoded)
          .map((p) => ({ lat: p.lat(), lng: p.lng() }));
      }
    } catch (err) {
      console.error("Error fetching route", err);
    }
    return [] as LatLng[];
  };

  useEffect(() => {
    if (!midpoint || !coord1 || !coord2 || !isLoaded) return;
    fetchRoute(coord1, midpoint).then(setPath1);
    fetchRoute(coord2, midpoint).then(setPath2);
  }, [midpoint, coord1, coord2, isLoaded]);

  useEffect(() => {
    if (!avgMidpoint || !coord1 || !coord2 || !isLoaded) return;
    fetchRoute(coord1, avgMidpoint).then(setAvgPath1);
    fetchRoute(coord2, avgMidpoint).then(setAvgPath2);
  }, [avgMidpoint, coord1, coord2, isLoaded]);

  // Wait for script to load
  if (!isLoaded) return <Skeleton className="w-full h-[200px] rounded-md" />;

  // Helper to pick the middle coordinate of a polyline
  const middleOfPath = (path: LatLng[]): LatLng | null => path.length ? path[Math.floor(path.length / 2)] : null;

  return (
    <div className=" mt-[-2rem] space-y-4 ">
      {/* Two Autocomplete inputs + Midpoint button */}
      <div className="flex space-x-4">
        <Autocomplete
          onLoad={(auto) => (autocompleteRef1.current = auto)}
          className="w-full w-full h-full likebutton shadow-none bg-opacity-50"
          onPlaceChanged={() =>
            handlePlaceChanged(autocompleteRef1, setAddress1, setCoord1)
          }
        >
          <Input
            placeholder="Enter first address"
            className="w-full h-full likebutton outline-1 outline-blue bg-white bg-opacity-50"

            value={address1}
            onChange={(e) => setAddress1(e.target.value)}
          />
        </Autocomplete>

        <Autocomplete
          onLoad={(auto) => (autocompleteRef2.current = auto)}
          className="w-full h-full likebutton  shadow-none bg-opacity-50"

          onPlaceChanged={() =>
            handlePlaceChanged(autocompleteRef2, setAddress2, setCoord2)
          }
        >
          <Input
            placeholder="Enter second address"
            className="w-full h-full likebutton outline-1 outline-blue bg-white bg-opacity-50"

            value={address2}
            onChange={(e) => setAddress2(e.target.value)}
          />
        </Autocomplete>

        <button
          onClick={handleFindMidpoint}
          disabled={loading || !address1 || !address2}
          className="likebutton outline-1 outline-rose-200 bg-white bg-opacity-50 p-2"
        >
          {loading ? "Finding..." : "Halfway"}
        </button>
      </div>

      {/* Display error if any */}
      {error && <p className="text-red-500">{error}</p>}

      {/* Google Map with a forced re-render circle */}

      {midpoint && (
        <GoogleMap
          center={midpoint}
          zoom={13}
          mapContainerStyle={mapContainerStyle}
          onLoad={(mapInstance) => setMap(mapInstance)}
          
        >
          {coord1 && <Marker position={coord1} label="A" />}
          {coord2 && <Marker position={coord2} label="B" />}
          <Marker position={midpoint} label="Midpoint" />
          {avgMidpoint && <Marker position={avgMidpoint} label="Avg" />}
          {map && (
            <CircleComponent
              map={map}
              midpoint={midpoint}
              radius={radius}
              options={{
                fillColor: "#AAF",
                strokeColor: "#00F",
                strokeWeight:.5,
                fillOpacity: 0.2,
              }}
            />
          )}



          {/* Labels for distances */}
          {distance1 && middleOfPath(path1) && (
            <Marker
              position={middleOfPath(path1)!}
              icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 0 }}
              label={{ text: `${distance1.toFixed(1)} mi`, fontSize: "12px", color: "#000" }}
            />
          )}
          {distance2 && middleOfPath(path2) && (
            <Marker
              position={middleOfPath(path2)!}
              icon={{ path: google.maps.SymbolPath.CIRCLE, scale: 0 }}
              label={{ text: `${distance2.toFixed(1)} mi`, fontSize: "12px", color: "#000" }}
            />
          )}
          {path1.length > 0 && (
            <Polyline path={path1} options={{ strokeColor: "green" }} />
          )}
          {path2.length > 0 && (
            <Polyline path={path2} options={{ strokeColor: "blue" }} />
          )}
          {avgPath1.length > 0 && (
            <Polyline path={avgPath1} options={{ strokeColor: "orange" }} />
          )}
          {avgPath2.length > 0 && (
            <Polyline path={avgPath2} options={{ strokeColor: "purple" }} />
          )}
          {venues.map((venue) => (
            <Marker
            
              key={venue.id.toString()}
              position={venue.location}
            />
          ))}
        </GoogleMap>
      )}
      <div className="flex flex-col w-full h-full space-x-4" >
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
        <div className="flex w-full space-x-4">

        {/* Venue Type + Radius controls */}
        <div className="flex w-full  h-full space-x-4  items-center">
        <Select   value={venueType} onValueChange={(val) => setVenueType(val)}>
          <SelectTrigger className=" likebutton bg-white bg-opacity-50 py-2 px-4 w-full h-full">
            <SelectValue placeholder="Venue Type" />
          </SelectTrigger>
          <SelectContent >
            <SelectItem className="hover:bg-slate-200" value="restaurant">Restaurant</SelectItem>
            <SelectItem className="hover:bg-slate-200" value="cafe">Cafe</SelectItem>
            <SelectItem className="hover:bg-slate-200" value="park">Park</SelectItem>
          </SelectContent>
        </Select>

       
        </div>
        <div className="flex w-full  h-full space-x-4  items-center">
        <Select   value={venueType} onValueChange={(val) => setVenueType(val)}>
          <SelectTrigger className=" likebutton bg-white bg-opacity-50 py-2 px-4 w-full h-full">
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent >
            <SelectItem className="hover:bg-slate-200" value="restaurant">Hours</SelectItem>
            <SelectItem className="hover:bg-slate-200" value="cafe">Reservation</SelectItem>
            <SelectItem className="hover:bg-slate-200" value="park">Type</SelectItem>
          </SelectContent>
        </Select>

       
        </div>
        <div className="flex w-full  h-full space-x-4  items-center">
        <Select   value={venueType} onValueChange={(val) => setVenueType(val)}>
          <SelectTrigger className=" likebutton bg-white bg-opacity-50 py-2 px-4 w-full h-full">
            <SelectValue placeholder="Sort By" />
          </SelectTrigger>
          <SelectContent >
            <SelectItem className="hover:bg-slate-200" value="restaurant">Price</SelectItem>
            <SelectItem className="hover:bg-slate-200" value="cafe">Rating</SelectItem>
            <SelectItem className="hover:bg-slate-200" value="park">Distance</SelectItem>
          </SelectContent>
        </Select>

        </div>
        </div>
        {/* <button
        
          onClick={handleFindMidpoint}
          disabled={loading || !address1 || !address2}
          className="likebutton bg-white bg-opacity-50 px-2 invisible"
        >
          {loading ? "Finding..." : "Halfway"}
        </button> */}
        </div>
        </div>
        <div className="flex flex-col w-full">
      {venues.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
          {venues.map((venue) => (
            <Card key={venue.id} className="likebutton bg-white bg-opacity-40">
              <CardHeader>
                <CardTitle className="text-block text-[1rem] tracking-[.05rem] leading-5">{venue.name}</CardTitle>
                <CardDescription className="text-[.85rem] ">{venue.address}</CardDescription>
                <hr></hr>
              </CardHeader>
              <CardContent className="space-y-0 text-[.9rem] tracking-[.05rem]">
                {venue.rating && <p>Rating: {venue.rating} / 5</p>}
                {/* {venue.types && <p>{venue.types.join(", ")}</p>} */}
                {venue.openingHours && (
                  <div className="text-sm">
                    {venue.openingHours.map((line, i) => (
                      <p key={i}>{line}</p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
</div>
    
    </div>
  );
}
