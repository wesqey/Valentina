"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface SearchResult {
  wikidataId: string | null;
  name: string;
  description: string | null;
  architect: string | null;
  year: number | null;
  address: string | null;
  source: "wikidata" | "osm";
}

// Name search — entity API then SPARQL filter (lightweight, no deep traversal)
async function searchByName(query: string): Promise<SearchResult[]> {
  const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&type=item&limit=20&format=json&origin=*`;
  const res = await fetch(url, { headers: { "User-Agent": "ValentinaArchitectureArchive/1.0" } });
  if (!res.ok) return [];
  const data = await res.json();
  const candidates: Array<{ id: string; label?: string; description?: string }> = data.search ?? [];
  if (!candidates.length) return [];

  // Filter: keep only items whose description contains architectural keywords
  // This is instant (no SPARQL) and good enough for name search
  const architecturalKeywords = [
    "building", "structure", "architecture", "monument", "tower", "bridge",
    "cathedral", "church", "temple", "mosque", "synagogue", "palace",
    "museum", "library", "stadium", "skyscraper", "house", "villa", "castle",
    "office", "station", "airport", "hospital", "school", "university",
    "hall", "theater", "theatre", "opera", "arena", "garden", "memorial",
    "landmark", "historic", "complex", "center", "centre", "plaza", "square",
    "chapel", "abbey", "basilica", "fort", "lighthouse", "observatory",
    "pavilion", "warehouse", "factory", "mill", "barn", "cottage",
  ];

  const filtered = candidates.filter((item) => {
    const desc = (item.description ?? "").toLowerCase();
    const label = (item.label ?? "").toLowerCase();
    return architecturalKeywords.some((kw) => desc.includes(kw) || label.includes(kw));
  });

  // If filtering leaves nothing, fall back to top 8 unfiltered (better than empty)
  const results = filtered.length > 0 ? filtered : candidates.slice(0, 8);

  return results.slice(0, 12).map((item) => ({
    wikidataId: item.id,
    name: item.label ?? item.id,
    description: item.description ?? null,
    architect: null,
    year: null,
    address: null,
    source: "wikidata" as const,
  }));
}

// Address search — Wikidata first, then Overpass OSM fallback
async function searchByAddress(query: string): Promise<SearchResult[]> {
  // Geocode with Nominatim
  const geoRes = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
    { headers: { "User-Agent": "ValentinaArchitectureArchive/1.0" } }
  );
  if (!geoRes.ok) return [];
  const geoData = await geoRes.json();
  if (!geoData.length) return [];
  const { lat, lon } = geoData[0];

  // Try Wikidata nearby first
  const sparql = `
    SELECT DISTINCT ?item ?itemLabel ?architectLabel ?inceptionDate ?description WHERE {
      SERVICE wikibase:around {
        ?item wdt:P625 ?coords.
        bd:serviceParam wikibase:center "Point(${lon} ${lat})"^^geo:wktLiteral.
        bd:serviceParam wikibase:radius "0.5".
      }
      ?item wdt:P31/wdt:P279* wd:Q811979.
      OPTIONAL { ?item wdt:P84 ?architect. }
      OPTIONAL { ?item wdt:P571 ?inceptionDate. }
      OPTIONAL {
        ?item schema:description ?description.
        FILTER(LANG(?description) = "en")
      }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 10
  `;

  const sparqlUrl = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
  try {
    const sparqlRes = await fetch(sparqlUrl, {
      headers: { Accept: "application/sparql-results+json", "User-Agent": "ValentinaArchitectureArchive/1.0" },
    });
    if (sparqlRes.ok) {
      const sparqlData = await sparqlRes.json();
      const wikidataResults: SearchResult[] = (sparqlData.results?.bindings ?? []).map((b: Record<string, { value: string }>) => {
        const year = b.inceptionDate?.value ? parseInt(b.inceptionDate.value.substring(0, 4)) : null;
        const id = b.item?.value?.split("/").pop() ?? "";
        return {
          wikidataId: id,
          name: b.itemLabel?.value ?? id,
          description: b.description?.value ?? null,
          architect: b.architectLabel?.value ?? null,
          year: isNaN(year as number) ? null : year,
          address: null,
          source: "wikidata" as const,
        };
      });
      if (wikidataResults.length > 0) return wikidataResults;
    }
  } catch { /* fall through to OSM */ }

  // Overpass fallback — find buildings near these coords
  const delta = 0.003; // ~300m
  const overpassQuery = `
    [out:json][timeout:10];
    (
      way["building"](${parseFloat(lat) - delta},${parseFloat(lon) - delta},${parseFloat(lat) + delta},${parseFloat(lon) + delta});
      way["historic"](${parseFloat(lat) - delta},${parseFloat(lon) - delta},${parseFloat(lat) + delta},${parseFloat(lon) + delta});
      relation["building"](${parseFloat(lat) - delta},${parseFloat(lon) - delta},${parseFloat(lat) + delta},${parseFloat(lon) + delta});
    );
    out tags center 10;
  `;

  try {
    const overpassRes = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: `data=${encodeURIComponent(overpassQuery)}`,
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "ValentinaArchitectureArchive/1.0" },
    });
    if (!overpassRes.ok) return [];
    const overpassData = await overpassRes.json();

    return (overpassData.elements ?? [])
      .filter((el: { tags?: Record<string, string> }) => el.tags?.name)
      .slice(0, 10)
      .map((el: { id: number; tags?: Record<string, string>; center?: { lat: number; lon: number } }) => ({
        wikidataId: el.tags?.wikidata ?? null,
        name: el.tags?.name ?? "Unnamed Building",
        description: el.tags?.["building:use"] ?? el.tags?.historic ?? el.tags?.building ?? null,
        architect: el.tags?.architect ?? null,
        year: el.tags?.["start_date"] ? parseInt(el.tags["start_date"]) : null,
        address: [el.tags?.["addr:housenumber"], el.tags?.["addr:street"]].filter(Boolean).join(" ") || null,
        source: "osm" as const,
      }));
  } catch {
    return [];
  }
}

export default function SearchResults() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"name" | "address">("name");

  useEffect(() => {
    if (!query) { setLoading(false); return; }
    setLoading(true);
    setResults([]);

    const looksLikeAddress = /\d/.test(query) || query.split(",").length > 1;

    const run = async () => {
      if (looksLikeAddress) {
        setMode("address");
        const r = await searchByAddress(query);
        if (r.length > 0) { setResults(r); setLoading(false); return; }
      }
      setMode("name");
      setResults(await searchByName(query));
      setLoading(false);
    };

    run();
  }, [query]);

  return (
    <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 40px" }}>
      <div style={{ marginBottom: "60px", maxWidth: "640px" }}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const v = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value;
            if (v.trim()) window.location.href = `/search?q=${encodeURIComponent(v)}`;
          }}
          style={{ display: "flex", border: "1px solid var(--border)" }}
        >
          <input
            name="q"
            defaultValue={query}
            placeholder="ADDRESS, ARCHITECT, OR BUILDING NAME"
            style={{ flex: 1, fontSize: "11px", letterSpacing: "0.08em", padding: "18px 20px", background: "none", border: "none", outline: "none", color: "var(--text)", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
          />
          <button type="submit" style={{ fontSize: "10px", letterSpacing: "0.1em", padding: "18px 24px", background: "none", border: "none", borderLeft: "1px solid var(--border)", cursor: "pointer", color: "var(--text)", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>
            SEARCH
          </button>
        </form>
      </div>

      {query && (
        <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--text-dim)", marginBottom: "32px" }}>
          {loading
            ? `SEARCHING FOR "${query.toUpperCase()}"...`
            : `${results.length} RESULT${results.length !== 1 ? "S" : ""} FOR "${query.toUpperCase()}" — ${mode === "address" ? "NEAR THIS ADDRESS" : "BY NAME"}`}
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ padding: "24px 0", borderBottom: "1px solid var(--border-dim)", opacity: 0.3 }}>
              <div style={{ height: "14px", width: `${180 + i * 30}px`, background: "var(--border)", marginBottom: "10px" }} />
              <div style={{ height: "9px", width: `${240 + i * 20}px`, background: "var(--border-dim)" }} />
            </div>
          ))}
        </div>
      )}

      {!loading && results.length === 0 && query && (
        <div style={{ padding: "60px 0", fontSize: "11px", letterSpacing: "0.1em", color: "var(--text-dim)" }}>
          NO BUILDINGS FOUND — TRY A DIFFERENT NAME OR ADDRESS
        </div>
      )}

      {!loading && results.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column" }}>
          {results.map((r, i) => (
            <Link
              key={r.wikidataId ?? `osm-${i}`}
              href={r.wikidataId ? `/building/${r.wikidataId}` : r.source === "osm" && r.address ? `/address?q=${encodeURIComponent(r.address)}` : "#"}
              style={{ display: "block", padding: "24px 0", borderBottom: "1px solid var(--border-dim)", textDecoration: "none", color: "var(--text)", transition: "opacity 0.2s", cursor: r.wikidataId ? "pointer" : "default" }}
              onMouseEnter={(e) => { if (r.wikidataId) (e.currentTarget as HTMLElement).style.opacity = "0.6"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "40px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 300, letterSpacing: "0.05em", marginBottom: "8px" }}>{r.name}</div>
                  <div style={{ fontSize: "9px", letterSpacing: "0.12em", color: "var(--text-dim)", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                    {r.architect && <span>{r.architect}</span>}
                    {r.year && !isNaN(r.year) && <span>{r.year}</span>}
                    {r.address && <span>{r.address}</span>}
                    {r.description && <span>{r.description}</span>}
                  </div>
                </div>
                <div style={{ fontSize: "9px", letterSpacing: "0.1em", color: "var(--text-dim)", flexShrink: 0 }}>
                  {r.source === "osm" ? "OSM" : r.wikidataId} {r.wikidataId ? "→" : "· NO DETAIL PAGE YET"}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
