import { Building } from "@/types";

// Full Wikidata SPARQL query for a single building
async function fetchFromWikidata(wikidataId: string): Promise<Partial<Building> | null> {
  const query = `
    SELECT ?item ?itemLabel ?architectLabel ?firmLabel ?inceptionDate ?styleLabel
           ?height ?floors ?useLabel ?coords ?osmId ?image
           (GROUP_CONCAT(DISTINCT ?materialLabel; separator="|") AS ?materials)
           ?description
    WHERE {
      BIND(wd:${wikidataId} AS ?item)
      OPTIONAL { ?item wdt:P84 ?architect. }
      OPTIONAL { ?item wdt:P466 ?firm. }
      OPTIONAL { ?item wdt:P571 ?inceptionDate. }
      OPTIONAL { ?item wdt:P149 ?style. }
      OPTIONAL { ?item wdt:P2048 ?height. }
      OPTIONAL { ?item wdt:P1101 ?floors. }
      OPTIONAL { ?item wdt:P366 ?use. }
      OPTIONAL { ?item wdt:P625 ?coords. }
      OPTIONAL { ?item wdt:P402 ?osmId. }
      OPTIONAL { ?item wdt:P18 ?image. }
      OPTIONAL { ?item wdt:P186 ?material. }
      OPTIONAL {
        ?item schema:description ?description.
        FILTER(LANG(?description) = "en")
      }
      SERVICE wikibase:label {
        bd:serviceParam wikibase:language "en".
        ?item rdfs:label ?itemLabel.
        ?architect rdfs:label ?architectLabel.
        ?firm rdfs:label ?firmLabel.
        ?style rdfs:label ?styleLabel.
        ?use rdfs:label ?useLabel.
        ?material rdfs:label ?materialLabel.
      }
    }
    GROUP BY ?item ?itemLabel ?architectLabel ?firmLabel ?inceptionDate ?styleLabel
             ?height ?floors ?useLabel ?coords ?osmId ?image ?description
    LIMIT 1
  `;

  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/sparql-results+json",
        "User-Agent": "ValentinaArchitectureArchive/1.0",
      },
      next: { revalidate: 3600 }, // cache 1 hour
    });

    if (!res.ok) return null;
    const data = await res.json();
    const b = data.results?.bindings?.[0];
    if (!b) return null;

    // Parse coords "Point(lng lat)" format
    let lat: number | undefined;
    let lng: number | undefined;
    if (b.coords?.value) {
      const match = b.coords.value.match(/Point\(([^ ]+) ([^ )]+)\)/);
      if (match) {
        lng = parseFloat(match[1]);
        lat = parseFloat(match[2]);
      }
    }

    // Parse inception year
    let year_built: number | null = null;
    if (b.inceptionDate?.value) {
      const y = parseInt(b.inceptionDate.value.substring(0, 4));
      if (!isNaN(y)) year_built = y;
    }

    // Parse image URL (convert Wikimedia filename to URL)
    let imageUrl: string | null = null;
    if (b.image?.value) {
      // Wikidata returns the full commons URL directly
      imageUrl = b.image.value;
    }

    const materials = b.materials?.value
      ? b.materials.value.split("|").filter(Boolean)
      : null;

    return {
      name: b.itemLabel?.value ?? null,
      wikidata_id: wikidataId,
      architect: b.architectLabel?.value ?? null,
      firm: b.firmLabel?.value ?? null,
      year_built,
      style: b.styleLabel?.value ?? null,
      height_m: b.height?.value ? parseFloat(b.height.value) : null,
      floors: b.floors?.value ? parseInt(b.floors.value) : null,
      use_type: b.useLabel?.value ?? null,
      materials,
      description: b.description?.value ?? null,
      osm_id: b.osmId?.value ? `relation/${b.osmId.value}` : null,
      lat: lat ?? 0,
      lng: lng ?? 0,
      images: imageUrl
        ? [{ url: imageUrl, caption: null, credit: "Wikimedia Commons" }]
        : [],
      sources: [
        {
          label: "Wikidata",
          url: `https://www.wikidata.org/wiki/${wikidataId}`,
        },
      ],
    };
  } catch {
    return null;
  }
}

// Reverse geocode lat/lng to get a street address via Nominatim
async function fetchAddress(lat: number, lng: number): Promise<{ address: string; city: string; country: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        headers: { "User-Agent": "ValentinaArchitectureArchive/1.0" },
        next: { revalidate: 86400 }, // cache 24 hours
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const a = data.address ?? {};

    const road = a.road ?? a.pedestrian ?? a.path ?? "";
    const houseNumber = a.house_number ?? "";
    const address = [houseNumber, road].filter(Boolean).join(" ") || (data.display_name?.split(",")[0] ?? "");
    const city = a.city ?? a.town ?? a.village ?? a.municipality ?? "";
    const country = a.country_code?.toUpperCase() ?? a.country ?? "";

    return { address, city, country };
  } catch {
    return null;
  }
}

// Main export — fetch a building by Wikidata ID
export async function fetchBuilding(wikidataId: string): Promise<Building | null> {
  const wikidata = await fetchFromWikidata(wikidataId);
  if (!wikidata) return null;

  // Get address from coordinates if we have them
  let address = "Address unknown";
  let city = "";
  let country = "";

  if (wikidata.lat && wikidata.lng && (wikidata.lat !== 0 || wikidata.lng !== 0)) {
    const geo = await fetchAddress(wikidata.lat, wikidata.lng);
    if (geo) {
      address = geo.address || address;
      city = geo.city;
      country = geo.country;
    }
  }

  return {
    id: wikidataId,
    name: wikidata.name ?? null,
    address,
    city,
    country,
    lat: wikidata.lat ?? 0,
    lng: wikidata.lng ?? 0,
    year_built: wikidata.year_built ?? null,
    year_demolished: null,
    architect: wikidata.architect ?? null,
    firm: wikidata.firm ?? null,
    style: wikidata.style ?? null,
    height_m: wikidata.height_m ?? null,
    floors: wikidata.floors ?? null,
    use_type: wikidata.use_type ?? null,
    materials: wikidata.materials ?? null,
    description: wikidata.description ?? null,
    osm_id: wikidata.osm_id ?? null,
    wikidata_id: wikidataId,
    verified: true,
    images: wikidata.images ?? [],
    sources: wikidata.sources ?? [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

// Search Wikidata for buildings matching a query
export async function searchBuildings(query: string): Promise<Array<{
  id: string;
  name: string;
  description: string | null;
  architect: string | null;
  year: number | null;
}>> {
  // Use Wikidata's entity search API (faster than SPARQL for typeahead)
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&type=item&limit=10&format=json&origin=*`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "ValentinaArchitectureArchive/1.0" },
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.search ?? []).map((item: {
      id: string;
      label?: string;
      description?: string;
    }) => ({
      id: item.id,
      name: item.label ?? item.id,
      description: item.description ?? null,
      architect: null,
      year: null,
    }));
  } catch {
    return [];
  }
}
