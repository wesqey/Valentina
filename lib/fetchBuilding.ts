import { Building } from "@/types";

async function fetchFromWikidata(wikidataId: string): Promise<Partial<Building> | null> {
  const query = `
    SELECT ?item ?itemLabel ?architectLabel ?firmLabel ?inceptionDate ?styleLabel
           ?movementLabel ?height ?floors ?floorArea ?siteArea ?units
           ?useLabel ?structuralLabel ?coords ?osmId ?image
           ?heritageLabel ?listedGrade
           ?leedLabel ?breeamLabel
           (GROUP_CONCAT(DISTINCT ?materialLabel; separator="|") AS ?materials)
           (GROUP_CONCAT(DISTINCT ?awardLabel; separator="|") AS ?awards)
           (GROUP_CONCAT(DISTINCT ?awardYear; separator="|") AS ?awardYears)
           ?description
    WHERE {
      BIND(wd:${wikidataId} AS ?item)
      OPTIONAL { ?item wdt:P84 ?architect. }
      OPTIONAL { ?item wdt:P176 ?firm. }
      OPTIONAL { ?item wdt:P571 ?inceptionDate. }
      OPTIONAL { ?item wdt:P149 ?style. }
      OPTIONAL { ?item wdt:P135 ?movement. }
      OPTIONAL { ?item wdt:P2048 ?height. }
      OPTIONAL { ?item wdt:P1101 ?floors. }
      OPTIONAL { ?item wdt:P2046 ?floorArea. }
      OPTIONAL { ?item wdt:P2660 ?siteArea. }
      OPTIONAL { ?item wdt:P1332 ?units. }
      OPTIONAL { ?item wdt:P366 ?use. }
      OPTIONAL { ?item wdt:P1301 ?structural. }
      OPTIONAL { ?item wdt:P625 ?coords. }
      OPTIONAL { ?item wdt:P402 ?osmId. }
      OPTIONAL { ?item wdt:P18 ?image. }
      OPTIONAL { ?item wdt:P1435 ?heritage. }
      OPTIONAL { ?item wdt:P186 ?material. }
      OPTIONAL {
        ?item p:P166 ?awardStatement.
        ?awardStatement ps:P166 ?award.
        OPTIONAL { ?awardStatement pq:P585 ?awardYear. }
      }
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
        ?movement rdfs:label ?movementLabel.
        ?use rdfs:label ?useLabel.
        ?structural rdfs:label ?structuralLabel.
        ?heritage rdfs:label ?heritageLabel.
        ?material rdfs:label ?materialLabel.
        ?award rdfs:label ?awardLabel.
      }
    }
    GROUP BY ?item ?itemLabel ?architectLabel ?firmLabel ?inceptionDate ?styleLabel
             ?movementLabel ?height ?floors ?floorArea ?siteArea ?units
             ?useLabel ?structuralLabel ?coords ?osmId ?image
             ?heritageLabel ?listedGrade ?leedLabel ?breeamLabel ?description
    LIMIT 1
  `;

  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(query)}&format=json`;

  try {
    const res = await fetch(url, {
      headers: {
        Accept: "application/sparql-results+json",
        "User-Agent": "ValentinaArchitectureArchive/1.0",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return null;
    const data = await res.json();
    const b = data.results?.bindings?.[0];
    if (!b) return null;

    // Coordinates
    let lat: number | undefined;
    let lng: number | undefined;
    if (b.coords?.value) {
      const match = b.coords.value.match(/Point\(([^ ]+) ([^ )]+)\)/);
      if (match) { lng = parseFloat(match[1]); lat = parseFloat(match[2]); }
    }

    // Year built
    let year_built: number | null = null;
    if (b.inceptionDate?.value) {
      const y = parseInt(b.inceptionDate.value.substring(0, 4));
      if (!isNaN(y)) year_built = y;
    }

    // Materials
    const materials = b.materials?.value
      ? b.materials.value.split("|").filter(Boolean).filter((v: string) => !v.startsWith("Q"))
      : null;

    // Awards
    const awardNames = b.awards?.value ? b.awards.value.split("|").filter(Boolean).filter((v: string) => !v.startsWith("Q")) : [];
    const awardYears = b.awardYears?.value ? b.awardYears.value.split("|") : [];
    const awards = awardNames.map((name: string, i: number) => ({
      name,
      year: awardYears[i] ? parseInt(awardYears[i].substring(0, 4)) : null,
      organization: null,
    }));

    return {
      name: b.itemLabel?.value ?? null,
      wikidata_id: wikidataId,
      architect: b.architectLabel?.value ?? null,
      firm: b.firmLabel?.value ?? null,
      year_built,
      style: b.styleLabel?.value ?? null,
      movement: b.movementLabel?.value ?? null,
      height_m: b.height?.value ? parseFloat(b.height.value) : null,
      floors: b.floors?.value ? parseInt(b.floors.value) : null,
      floor_area_m2: b.floorArea?.value ? parseFloat(b.floorArea.value) : null,
      site_area_m2: b.siteArea?.value ? parseFloat(b.siteArea.value) : null,
      units: b.units?.value ? parseInt(b.units.value) : null,
      use_type: b.useLabel?.value ?? null,
      structural_system: b.structuralLabel?.value ?? null,
      materials: materials && materials.length > 0 ? materials : null,
      awards: awards.length > 0 ? awards : null,
      heritage_status: b.heritageLabel?.value ?? null,
      leed_rating: b.leedLabel?.value ?? null,
      breeam_rating: b.breeamLabel?.value ?? null,
      description: b.description?.value ?? null,
      osm_id: b.osmId?.value ? `relation/${b.osmId.value}` : null,
      lat: lat ?? 0,
      lng: lng ?? 0,
      images: b.image?.value
        ? [{ url: b.image.value, caption: null, credit: "Wikimedia Commons" }]
        : [],
      sources: [{ label: "Wikidata", url: `https://www.wikidata.org/wiki/${wikidataId}` }],
    };
  } catch {
    return null;
  }
}

async function fetchAddress(lat: number, lng: number): Promise<{ address: string; city: string; country: string } | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
      {
        headers: { "User-Agent": "ValentinaArchitectureArchive/1.0" },
        next: { revalidate: 86400 },
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

export async function fetchBuilding(wikidataId: string): Promise<Building | null> {
  const wikidata = await fetchFromWikidata(wikidataId);
  if (!wikidata) return null;

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
    movement: wikidata.movement ?? null,
    height_m: wikidata.height_m ?? null,
    floors: wikidata.floors ?? null,
    floor_area_m2: wikidata.floor_area_m2 ?? null,
    site_area_m2: wikidata.site_area_m2 ?? null,
    units: wikidata.units ?? null,
    use_type: wikidata.use_type ?? null,
    structural_system: wikidata.structural_system ?? null,
    materials: wikidata.materials ?? null,
    leed_rating: wikidata.leed_rating ?? null,
    breeam_rating: wikidata.breeam_rating ?? null,
    energy_rating: null,
    carbon_footprint: null,
    sustainability_notes: null,
    awards: wikidata.awards ?? null,
    heritage_status: wikidata.heritage_status ?? null,
    listed_grade: null,
    description: wikidata.description ?? null,
    images: wikidata.images ?? [],
    floorplans: [],
    sources: wikidata.sources ?? [],
    osm_id: wikidata.osm_id ?? null,
    wikidata_id: wikidataId,
    verified: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

export async function searchBuildings(query: string): Promise<Array<{
  id: string;
  name: string;
  description: string | null;
  architect: string | null;
  year: number | null;
}>> {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&type=item&limit=10&format=json&origin=*`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "ValentinaArchitectureArchive/1.0" } });
    if (!res.ok) return [];
    const data = await res.json();
    return (data.search ?? []).map((item: { id: string; label?: string; description?: string }) => ({
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
