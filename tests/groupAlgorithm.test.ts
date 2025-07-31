import { describe, it, expect, vi, beforeEach } from "vitest";
import { findBestVenues, LatLng, Candidate } from "../packages/halfway-utils/groupAlgorithm";

const mockFetch = vi.fn();

beforeEach(() => {
  mockFetch.mockReset();
  global.fetch = mockFetch as any;
});

describe("findBestVenues", () => {
  it("orders venues by cost", async () => {
    const origins: LatLng[] = [
      { lat: 0, lng: 0 },
      { lat: 0.001, lng: 0.001 },
    ];
    // First call: nearbysearch
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          { place_id: "p1", geometry: { location: { lat: 0, lng: 0 } } },
          { place_id: "p2", geometry: { location: { lat: 0, lng: 0 } } },
        ],
      }),
    } as any);
    // details p1
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ result: { name: "A", formatted_address: "a" } }) } as any);
    // details p2
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ result: { name: "B", formatted_address: "b" } }) } as any);
    // distance matrix
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        rows: [
          { elements: [{ duration: { value: 600 } }, { duration: { value: 700 } }] },
          { elements: [{ duration: { value: 1200 } }, { duration: { value: 700 } }] },
        ],
      }),
    } as any);

    const res = await findBestVenues(origins, "restaurant", 2);
    expect(res).toHaveLength(2);
    expect(res[0].id).toBe("p2");
    expect(res[1].id).toBe("p1");
  });
});
