import uniqBy from "lodash/uniqBy";
import { get as levenshtein } from "fast-levenshtein";

export type Venue = {
  id: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  rating?: number;
  openingHours?: string[];
  types?: string[];
};

export const dedupeByPlaceId = (arr: Venue[]): Venue[] => {
  const uniqueById = uniqBy(arr, "id");

  const deduped: Venue[] = [];
  for (const venue of uniqueById) {
    const duplicate = deduped.find(
      (v) =>
        levenshtein(
          (v.name + v.address).toLowerCase(),
          (venue.name + venue.address).toLowerCase()
        ) < 3
    );
    if (!duplicate) {
      deduped.push(venue);
    }
  }

  return deduped;
};
