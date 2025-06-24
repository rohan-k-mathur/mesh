import { UserAttributes } from "@prisma/client";
import { upsertUserAttributes } from "./actions/userattributes.actions";

const OMDB_API_KEY = "c971c02c";
const discogsToken = "cuqwVeLuoiKZsMfpWDLDPeTIjviOBgJnlvHELjse";

export interface OptionType {
  value: string;
  label: string;
}

export async function fetchMovies(query: string): Promise<OptionType[]> {
  try {
    const response = await fetch(
      `https://www.omdbapi.com/?s=${query}&apikey=${OMDB_API_KEY}`
    );
    const data = await response.json();
    if (data.Search && Array.isArray(data.Search)) {
      const movies = data.Search.map((movie: any) => ({
        value: movie.imdbID,
        label: movie.Title,
        year: parseInt(movie.Year),
      }));
      return movies;
    }
    return [];
  } catch (error: any) {
    console.error("Error fetching movies:", error);
    return [];
  }
}

export async function fetchAlbums(query: string): Promise<OptionType[]> {
  try {
    const response = await fetch(
      `https://api.discogs.com/database/search?q=${encodeURIComponent(
        query
      )}&type=release`,
      {
        headers: {
          Authorization: `Discogs token=${discogsToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    if (data.results && Array.isArray(data.results)) {
      const albums = data.results.map((album: any) => ({
        value: album.id.toString(),
        label: album.title,
      }));

      // Remove duplicates based on the album label (title)
      const uniqueAlbums = albums.filter(
        (album: any, index: any, self: any) =>
          index === self.findIndex((a: any) => a.label === album.label)
      );

      return uniqueAlbums;
    } else {
      return [];
    }
  } catch (error: any) {
    console.error("Error fetching albums:", error);
    return [];
  }
}

export async function fetchArtists(query: string): Promise<OptionType[]> {
  try {
    const response = await fetch(
      `https://api.discogs.com/database/search?q=${encodeURIComponent(
        query
      )}&type=artist`,
      {
        headers: {
          Authorization: `Discogs token=${discogsToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    if (data.results && Array.isArray(data.results)) {
      const artists = data.results.map((artist: any) => ({
        value: artist.id.toString(),
        label: artist.title,
      }));

      // Remove duplicates based on the artist label (name)
      const uniqueArtists = artists.filter(
        (artist: any, index: any, self: any) =>
          index === self.findIndex((a: any) => a.label === artist.label)
      );

      return uniqueArtists;
    } else {
      return [];
    }
  } catch (error: any) {
    console.error("Error fetching artists:", error);
    return [];
  }
}

export async function fetchTracks(query: string): Promise<OptionType[]> {
  try {
    const response = await fetch(
      `https://api.discogs.com/database/search?q=${encodeURIComponent(
        query
      )}&type=track`,
      {
        headers: {
          Authorization: `Discogs token=${discogsToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    if (data.results && Array.isArray(data.results)) {
      const tracks = data.results.map((track: any) => ({
        value: track.id.toString(),
        label: track.title,
      }));

      // Remove duplicates based on the track label (title)
      const uniqueTracks = tracks.filter(
        (track: any, index: any, self: any) =>
          index === self.findIndex((t: any) => t.label === track.label)
      );
      return uniqueTracks;
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching tracks:", error);
    return [];
  }
}

export async function fetchInterests(query: string): Promise<OptionType[]> {
  return [
    { value: "rock_climbing", label: "Rock Climbing" },
    { value: "skydiving", label: "Skydiving" },
    { value: "scuba_diving", label: "Scuba Diving" },
    { value: "white_water_rafting", label: "White Water Rafting" },
    { value: "paragliding", label: "Paragliding" },
    { value: "spelunking", label: "Spelunking" },
    { value: "car_restoration", label: "Car Restoration" },
    { value: "car_detailing", label: "Car Detailing" },
    { value: "auto_racing", label: "Auto Racing" },
    { value: "off_roading", label: "Off-Roading" },
    { value: "car_photography", label: "Car Photography" },
    { value: "car_collecting", label: "Car Collecting" },
    { value: "autocross", label: "Autocross" },
    { value: "hiking", label: "Hiking" },
    { value: "kayaking", label: "Kayaking/Canoeing" },
    { value: "stargazing", label: "Stargazing" },
    { value: "cycling", label: "Cycling" },
    { value: "nature_walks", label: "Nature Walks" },
    { value: "biking", label: "Biking" },
    { value: "picnicking", label: "Picnicking" },
    { value: "camping", label: "Camping" },
    { value: "geocaching", label: "Geocaching" },
    { value: "parkour", label: "Parkour" },
    { value: "free_running", label: "Free Running" },
    { value: "skateboarding", label: "Skateboarding" },
    { value: "rollerblading", label: "Rollerblading/Roller Skating" },
    { value: "motocross", label: "Motocross" },
    { value: "skiing", label: "Skiing" },
    { value: "kite_flying", label: "Kite Flying" },
    { value: "beach_running", label: "Beach Running" },
    { value: "beach_cleanup", label: "Beach Cleanup" },
    { value: "surfing", label: "Surfing" },
    { value: "beach_yoga", label: "Beach Yoga" },
    { value: "beach_photography", label: "Beach Photography" },
    { value: "dancing", label: "Dancing" },
    { value: "trampoline_jumping", label: "Trampoline Jumping" },
    { value: "kickboxing", label: "Kickboxing" },
    { value: "zumba", label: "Zumba" },
    { value: "swimming", label: "Swimming" },
  ];
}

export function convertListToSelectables(interests: string[]) {
  if (!interests) {
    return [{} as OptionType];
  }
  return interests.map(
    (interest) =>
      ({
        label: interest,
        value: interest,
      } as OptionType)
  );
}

export function convertSelectablesToList(selectables: OptionType[]) {
  return selectables.map((selectable) => selectable.label);
}

export function submitEdits(
  selectableType: "INTERESTS" | "ALBUMS" | "MOVIES" | "TRACKS" | "ARTISTS",
  selectables: OptionType[],
  userAttributes: UserAttributes,
  path: string
) {
  switch (selectableType) {
    case "INTERESTS":
      return upsertUserAttributes({
        userAttributes: {
          ...userAttributes,
          interests: convertSelectablesToList(selectables),
        },
        path,
      });
    case "ALBUMS":
      return upsertUserAttributes({
        userAttributes: {
          ...userAttributes,
          albums: convertSelectablesToList(selectables),
        },
        path,
      });
    case "MOVIES":
      return upsertUserAttributes({
        userAttributes: {
          ...userAttributes,
          movies: convertSelectablesToList(selectables),
        },
        path,
      });
    case "TRACKS":
      return upsertUserAttributes({
        userAttributes: {
          ...userAttributes,
          songs: convertSelectablesToList(selectables),
        },
        path,
      });
    case "ARTISTS":
      return upsertUserAttributes({
        userAttributes: {
          ...userAttributes,
          artists: convertSelectablesToList(selectables),
        },
        path,
      });
    default:
      console.error("Nothing to update");
  }
}
