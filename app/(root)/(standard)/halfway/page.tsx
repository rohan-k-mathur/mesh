"use client";
import { useState, useRef, useEffect } from "react";
import {
  useLoadScript,
  GoogleMap,
  Marker,
  Circle,
  Autocomplete,
  Libraries,
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

const libraries: Libraries = ["places"];
const mapContainerStyle = { width: "100%", height: "400px" };

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

type LatLng = { lat: number; lng: number };

type Venue = {
  id: string;
  name: string;
  address: string;
  location: LatLng;
  rating?: number;
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
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(false);
  const [venueType, setVenueType] = useState("restaurant");
  const [radius, setRadius] = useState(1500);
  const [error, setError] = useState<string | null>(null);

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
      setCoord({ lat: location.lat(), lng: location.lng() });
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
        const newVenues: Venue[] = data.results.map((place: any) => ({
          id: place.place_id,
          name: place.name,
          address: place.vicinity || place.formatted_address,
          location: {
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
          },
          rating: place.rating,
        }));
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

    const mid: LatLng = {
      lat: (coord1.lat + coord2.lat) / 2,
      lng: (coord1.lng + coord2.lng) / 2,
    };
    setMidpoint(mid);

    // Immediately fetch venues for the current radius & type
    await fetchVenues(mid, radius, venueType);
  };

  // Auto-refetch when radius or venueType changes (if we have a midpoint)
  useEffect(() => {
    if (midpoint) {
      fetchVenues(midpoint, radius, venueType);
    }
  }, [midpoint, radius, venueType]);

  // Wait for script to load
  if (!isLoaded) return <Skeleton className="w-full h-[200px] rounded-md" />;

  return (
    <div className="p-6 space-y-4">
      {/* Two Autocomplete inputs + Midpoint button */}
      <div className="flex space-x-4">
        <Autocomplete
          onLoad={(auto) => (autocompleteRef1.current = auto)}
          onPlaceChanged={() =>
            handlePlaceChanged(autocompleteRef1, setAddress1, setCoord1)
          }
        >
          <Input
            placeholder="Enter first address"
            value={address1}
            onChange={(e) => setAddress1(e.target.value)}
          />
        </Autocomplete>

        <Autocomplete
          onLoad={(auto) => (autocompleteRef2.current = auto)}
          onPlaceChanged={() =>
            handlePlaceChanged(autocompleteRef2, setAddress2, setCoord2)
          }
        >
          <Input
            placeholder="Enter second address"
            value={address2}
            onChange={(e) => setAddress2(e.target.value)}
          />
        </Autocomplete>

        <Button
          onClick={handleFindMidpoint}
          disabled={loading || !address1 || !address2}
        >
          {loading ? "Finding..." : "Find Midpoint"}
        </Button>
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
          <Marker position={midpoint} label="Midpoint" />
          {map && (
            <CircleComponent
              map={map}
              midpoint={midpoint}
              radius={radius}
              options={{
                fillColor: "#AAF",
                strokeColor: "#00F",
                fillOpacity: 0.2,
              }}
            />
          )}
          {venues.map((venue) => (
            <Marker
              key={venue.id}
              position={venue.location}
              label={venue.name}
            />
          ))}
        </GoogleMap>
      )}

      {/* Venue Type + Radius controls */}
      <div className="flex space-x-4 items-center">
        <Select value={venueType} onValueChange={(val) => setVenueType(val)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Venue Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="restaurant">Restaurant</SelectItem>
            <SelectItem value="cafe">Cafe</SelectItem>
            <SelectItem value="park">Park</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1">
          <label className="block">Radius: {radius}m</label>
          <Slider
            value={[radius]}
            min={500}
            max={5000}
            step={100}
            onValueChange={(value) => setRadius(value[0])}
          />
        </div>
      </div>
    </div>
  );
}
