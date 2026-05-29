export interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    postcode?: string;
  };
}

export async function geocodeAddress(query: string): Promise<NominatimResult[]> {
  const encoded = encodeURIComponent(query);
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&addressdetails=1&limit=5`,
    {
      headers: {
        "User-Agent": "ValentinaArchitectureArchive/1.0 (contact@example.com)",
      },
    }
  );
  if (!res.ok) throw new Error("Geocoding failed");
  return res.json();
}

export async function reverseGeocode(lat: number, lng: number): Promise<NominatimResult | null> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
    {
      headers: {
        "User-Agent": "ValentinaArchitectureArchive/1.0 (contact@example.com)",
      },
    }
  );
  if (!res.ok) return null;
  return res.json();
}
