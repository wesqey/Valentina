export interface AddressBuilding {
    source: "osm" | "nominatim";
    osmId: string | null;
    wikidataId: string | null;
    name: string | null;
    address: string;
    city: string;
    country: string;
    lat: number;
    lng: number;
  
    // What OSM might have
    year_built: number | null;
    building_type: string | null;
    levels: number | null;
    height_m: number | null;
    architect: string | null;
    operator: string | null;
    website: string | null;
    heritage: string | null;
    historic: string | null;
    material: string | null;
    roof_material: string | null;
    roof_shape: string | null;
    amenity: string | null;
    denomination: string | null;
    religion: string | null;
    wikipedia: string | null;
    description: string | null;
  }
  
  export async function fetchByAddress(query: string): Promise<AddressBuilding | null> {
    // Step 1: Geocode with Nominatim — get coordinates + OSM element ID
    const geoRes = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&extratags=1&limit=1`,
      { headers: { "User-Agent": "ValentinaArchitectureArchive/1.0" } }
    );
    if (!geoRes.ok) return null;
    const geoData = await geoRes.json();
    if (!geoData.length) return null;
  
    const place = geoData[0];
    const lat = parseFloat(place.lat);
    const lng = parseFloat(place.lon);
    const osmType = place.osm_type; // "way", "node", "relation"
    const osmId = place.osm_id;
    const a = place.address ?? {};
  
    const address = [a.house_number, a.road ?? a.pedestrian].filter(Boolean).join(" ") || (place.display_name?.split(",")[0] ?? "");
    const city = a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? "";
    const country = a.country_code?.toUpperCase() ?? "";
  
    // Extratags from Nominatim (sometimes has architect, year, etc.)
    const extratags = place.extratags ?? {};
  
    // Step 2: Fetch full OSM element tags via Overpass for that specific element
    let osmTags: Record<string, string> = {};
    if (osmId && osmType) {
      const typeMap: Record<string, string> = { way: "way", node: "node", relation: "relation" };
      const osmTypeFull = typeMap[osmType] ?? "way";
      const overpassQuery = `[out:json][timeout:10]; ${osmTypeFull}(${osmId}); out tags;`;
      try {
        const overpassRes = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          body: `data=${encodeURIComponent(overpassQuery)}`,
          headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "ValentinaArchitectureArchive/1.0" },
        });
        if (overpassRes.ok) {
          const overpassData = await overpassRes.json();
          osmTags = overpassData.elements?.[0]?.tags ?? {};
        }
      } catch { /* continue without OSM tags */ }
    }
  
    // Merge tags — OSM element tags take priority over Nominatim extratags
    const tags = { ...extratags, ...osmTags };
  
    // Parse year built — OSM uses start_date, construction:date, or year
    let year_built: number | null = null;
    const yearStr = tags["start_date"] ?? tags["construction:date"] ?? tags["year_built"] ?? tags["year"];
    if (yearStr) {
      const y = parseInt(yearStr);
      if (!isNaN(y) && y > 1000 && y < 2100) year_built = y;
    }
  
    // Height
    let height_m: number | null = null;
    const heightStr = tags["height"] ?? tags["building:height"];
    if (heightStr) {
      const h = parseFloat(heightStr);
      if (!isNaN(h)) height_m = h;
    }
  
    // Levels/floors
    let levels: number | null = null;
    const levelsStr = tags["building:levels"] ?? tags["levels"];
    if (levelsStr) {
      const l = parseInt(levelsStr);
      if (!isNaN(l)) levels = l;
    }
  
    // Wikipedia — convert "en:Title" to full URL
    let wikipedia: string | null = null;
    const wikiTag = tags["wikipedia"];
    if (wikiTag) {
      const parts = wikiTag.split(":");
      if (parts.length >= 2) {
        wikipedia = `https://${parts[0]}.wikipedia.org/wiki/${parts.slice(1).join(":")}`;
      }
    }
  
    return {
      source: "osm",
      osmId: osmId ? `${osmType}/${osmId}` : null,
      wikidataId: tags["wikidata"] ?? null,
      name: tags["name"] ?? tags["official_name"] ?? null,
      address,
      city,
      country,
      lat,
      lng,
      year_built,
      building_type: tags["building"] ?? tags["amenity"] ?? tags["historic"] ?? null,
      levels,
      height_m,
      architect: tags["architect"] ?? tags["designer"] ?? null,
      operator: tags["operator"] ?? tags["owner"] ?? null,
      website: tags["website"] ?? tags["contact:website"] ?? tags["url"] ?? null,
      heritage: tags["heritage"] ?? tags["heritage:operator"] ?? null,
      historic: tags["historic"] ?? null,
      material: tags["building:material"] ?? tags["material"] ?? null,
      roof_material: tags["roof:material"] ?? null,
      roof_shape: tags["roof:shape"] ?? null,
      amenity: tags["amenity"] ?? null,
      denomination: tags["denomination"] ?? null,
      religion: tags["religion"] ?? null,
      wikipedia,
      description: tags["description"] ?? tags["note"] ?? null,
    };
  }
  