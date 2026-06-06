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
    // Step 1: Geocode with Nominatim
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
    const osmType = place.osm_type;
    const osmId = place.osm_id;
    const a = place.address ?? {};
  
    const address = [a.house_number, a.road ?? a.pedestrian].filter(Boolean).join(" ") || (place.display_name?.split(",")[0] ?? "");
    const city = a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? "";
    const country = a.country_code?.toUpperCase() ?? "";
    const extratags = place.extratags ?? {};
  
    // Step 2: Check if Nominatim only found a street, not a building
    const isStreetOnly = place.class === "highway" || 
      ["residential", "primary", "secondary", "tertiary", "service", "unclassified"].includes(place.type);
  
    let resolvedOsmType = osmType;
    let resolvedOsmId = osmId;
    let osmTags: Record<string, string> = {};
  
    if (isStreetOnly) {
      // Nominatim found the street but not the building — search Overpass for
      // a building with a matching house number near these coordinates
      const delta = 0.0003;
      const houseNumber = a.house_number ?? query.match(/^\d+/)?.[0] ?? "";
      const overpassFallback = `
        [out:json][timeout:10];
        (
          way["addr:housenumber"="${houseNumber}"](${lat - delta},${lng - delta},${lat + delta},${lng + delta});
          node["addr:housenumber"="${houseNumber}"](${lat - delta},${lng - delta},${lat + delta},${lng + delta});
        );
        out tags center 3;
      `;
      try {
        const fallbackRes = await fetch("https://overpass-api.de/api/interpreter", {
          method: "POST",
          body: `data=${encodeURIComponent(overpassFallback)}`,
          headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "ValentinaArchitectureArchive/1.0" },
        });
        if (fallbackRes.ok) {
          const fallbackData = await fallbackRes.json();
          const el = fallbackData.elements?.[0];
          if (el) {
            resolvedOsmType = el.type;
            resolvedOsmId = el.id;
            osmTags = el.tags ?? {};
          }
        }
      } catch { /* continue */ }
    }
  
    // Step 3: Fetch full OSM element tags if we have an element ID
    if (Object.keys(osmTags).length === 0 && resolvedOsmId && resolvedOsmType) {
      const typeMap: Record<string, string> = { way: "way", node: "node", relation: "relation" };
      const osmTypeFull = typeMap[resolvedOsmType] ?? "way";
      const overpassQuery = `[out:json][timeout:10]; ${osmTypeFull}(${resolvedOsmId}); out tags;`;
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
      } catch { /* continue */ }
    }
  
    const tags = { ...extratags, ...osmTags };
  
    // Parse year built
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
  
    // Levels
    let levels: number | null = null;
    const levelsStr = tags["building:levels"] ?? tags["levels"];
    if (levelsStr) {
      const l = parseInt(levelsStr);
      if (!isNaN(l)) levels = l;
    }
  
    // Wikipedia
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
      osmId: resolvedOsmId ? `${resolvedOsmType}/${resolvedOsmId}` : null,
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