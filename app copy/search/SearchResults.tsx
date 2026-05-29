"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface SearchResult {
  wikidataId: string;
  name: string;
  description: string | null;
  architect: string | null;
  year: number | null;
}

async function searchByName(query: string): Promise<SearchResult[]> {
  const sparql = `
    SELECT DISTINCT ?item ?itemLabel ?architectLabel ?inceptionDate ?description WHERE {
      ?item wdt:P31/wdt:P279* wd:Q41176.
      ?item rdfs:label ?label.
      FILTER(CONTAINS(LCASE(?label), LCASE("${query.replace(/"/g, "")}")))
      FILTER(LANG(?label) = "en")
      OPTIONAL { ?item wdt:P84 ?architect. }
      OPTIONAL { ?item wdt:P571 ?inceptionDate. }
      OPTIONAL {
        ?item schema:description ?description.
        FILTER(LANG(?description) = "en")
      }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 12
  `;
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
  const res = await fetch(url, { headers: { Accept: "application/sparql-results+json", "User-Agent": "ValentinaArchitectureArchive/1.0" } });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results?.bindings ?? []).map((b: Record<string, { value: string }>) => {
    const year = b.inceptionDate?.value ? parseInt(b.inceptionDate.value.substring(0, 4)) : null;
    const id = b.item?.value?.split("/").pop() ?? "";
    return { wikidataId: id, name: b.itemLabel?.value ?? id, description: b.description?.value ?? null, architect: b.architectLabel?.value ?? null, year: isNaN(year as number) ? null : year };
  });
}

async function searchByAddress(query: string): Promise<SearchResult[]> {
  const geoRes = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, { headers: { "User-Agent": "ValentinaArchitectureArchive/1.0" } });
  if (!geoRes.ok) return [];
  const geoData = await geoRes.json();
  if (!geoData.length) return [];
  const { lat, lon } = geoData[0];
  const delta = 0.005;
  const sparql = `
    SELECT DISTINCT ?item ?itemLabel ?architectLabel ?inceptionDate ?description ?coords WHERE {
      ?item wdt:P31/wdt:P279* wd:Q41176.
      ?item wdt:P625 ?coords.
      FILTER(?coords > "Point(${parseFloat(lon) - delta} ${parseFloat(lat) - delta})"^^geo:wktLiteral)
      FILTER(?coords < "Point(${parseFloat(lon) + delta} ${parseFloat(lat) + delta})"^^geo:wktLiteral)
      OPTIONAL { ?item wdt:P84 ?architect. }
      OPTIONAL { ?item wdt:P571 ?inceptionDate. }
      OPTIONAL {
        ?item schema:description ?description.
        FILTER(LANG(?description) = "en")
      }
      SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
    }
    LIMIT 12
  `;
  const url = `https://query.wikidata.org/sparql?query=${encodeURIComponent(sparql)}&format=json`;
  const res = await fetch(url, { headers: { Accept: "application/sparql-results+json", "User-Agent": "ValentinaArchitectureArchive/1.0" } });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results?.bindings ?? []).map((b: Record<string, { value: string }>) => {
    const year = b.inceptionDate?.value ? parseInt(b.inceptionDate.value.substring(0, 4)) : null;
    const id = b.item?.value?.split("/").pop() ?? "";
    return { wikidataId: id, name: b.itemLabel?.value ?? id, description: b.description?.value ?? null, architect: b.architectLabel?.value ?? null, year: isNaN(year as number) ? null : year };
  });
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
        <form onSubmit={(e) => { e.preventDefault(); const v = (e.currentTarget.elements.namedItem("q") as HTMLInputElement).value; if (v.trim()) window.location.href = `/search?q=${encodeURIComponent(v)}`; }} style={{ display: "flex", border: "1px solid var(--border)" }}>
          <input name="q" defaultValue={query} placeholder="ADDRESS, ARCHITECT, OR BUILDING NAME" autoFocus style={{ flex: 1, fontSize: "11px", letterSpacing: "0.08em", padding: "18px 20px", background: "none", border: "none", outline: "none", color: "var(--text)", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }} />
          <button type="submit" style={{ fontSize: "10px", letterSpacing: "0.1em", padding: "18px 24px", background: "none", border: "none", borderLeft: "1px solid var(--border)", cursor: "pointer", color: "var(--text)", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}>SEARCH</button>
        </form>
      </div>

      {query && (
        <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--text-dim)", marginBottom: "32px" }}>
          {loading ? `SEARCHING FOR "${query.toUpperCase()}"...` : `${results.length} RESULT${results.length !== 1 ? "S" : ""} FOR "${query.toUpperCase()}" — ${mode === "address" ? "NEAR THIS ADDRESS" : "BY NAME"}`}
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
          {results.map((r) => (
            <Link key={r.wikidataId} href={`/building/${r.wikidataId}`}
              style={{ display: "block", padding: "24px 0", borderBottom: "1px solid var(--border-dim)", textDecoration: "none", color: "var(--text)", transition: "opacity 0.2s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.6"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "40px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "15px", fontWeight: 300, letterSpacing: "0.05em", marginBottom: "8px" }}>{r.name}</div>
                  <div style={{ fontSize: "9px", letterSpacing: "0.12em", color: "var(--text-dim)", display: "flex", gap: "16px", flexWrap: "wrap" }}>
                    {r.architect && <span>{r.architect}</span>}
                    {r.year && <span>{r.year}</span>}
                    {r.description && <span>{r.description}</span>}
                  </div>
                </div>
                <div style={{ fontSize: "9px", letterSpacing: "0.1em", color: "var(--text-dim)", flexShrink: 0 }}>{r.wikidataId} →</div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
