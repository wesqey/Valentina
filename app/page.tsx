"use client";

import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";

const CITIES = [
  { name: "New York", state: "NY" },
  { name: "Los Angeles", state: "CA" },
  { name: "Chicago", state: "IL" },
  { name: "Houston", state: "TX" },
  { name: "Phoenix", state: "AZ" },
];

interface Suggestion {
  id: string;
  name: string;
  description: string | null;
}

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState<typeof CITIES[0] | null>(null);
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement !== inputRef.current) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const looksLikeAddress = /\d/.test(query) || query.split(",").length > 1;
    if (!query.trim() || query.length < 3 || looksLikeAddress) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      try {
        const url = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&type=item&limit=8&format=json&origin=*`;
        const res = await fetch(url, { headers: { "User-Agent": "ValentinaArchitectureArchive/1.0" } });
        const data = await res.json();

        const architecturalKeywords = [
          "building", "structure", "architecture", "monument", "tower", "bridge",
          "cathedral", "church", "temple", "mosque", "palace", "museum", "library",
          "stadium", "skyscraper", "house", "villa", "castle", "hall", "theater",
          "theatre", "opera", "arena", "memorial", "landmark", "historic", "chapel",
          "abbey", "basilica", "fort", "lighthouse", "pavilion", "warehouse",
        ];

        const filtered = (data.search ?? []).filter((item: { description?: string; label?: string }) => {
          const desc = (item.description ?? "").toLowerCase();
          const label = (item.label ?? "").toLowerCase();
          return architecturalKeywords.some((kw) => desc.includes(kw) || label.includes(kw));
        });

        setSuggestions(
          filtered.slice(0, 6).map((item: { id: string; label?: string; description?: string }) => ({
            id: item.id,
            name: item.label ?? item.id,
            description: item.description ?? null,
          }))
        );
        setShowSuggestions(filtered.length > 0);
      } catch {
        setSuggestions([]);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleSearch() {
    if (!query.trim()) return;
    setShowSuggestions(false);
    const fullQuery = city ? `${query}, ${city.name}, ${city.state}` : query;
    const looksLikeAddress = /\d/.test(query) || query.split(",").length > 1;
    if (looksLikeAddress) {
      window.location.href = `/address?q=${encodeURIComponent(fullQuery)}`;
    } else {
      window.location.href = `/search?q=${encodeURIComponent(fullQuery)}`;
    }
  }

  function handleSuggestionClick(suggestion: Suggestion) {
    setShowSuggestions(false);
    window.location.href = `/building/${suggestion.id}`;
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <Header />
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "120px 40px 80px" }}>

        <div style={{ marginBottom: "60px" }}>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 300, letterSpacing: "0.08em", lineHeight: 1.1, margin: "0 0 24px" }}>
            ARCHITECTURE,<br />ADDRESSED.
          </h1>
          <p style={{ fontSize: "12px", letterSpacing: "0.06em", color: "var(--text-muted)", lineHeight: 1.9, maxWidth: "440px", margin: 0 }}>
            A building database focused on architectural detail — architect, style, materials, year built.
            Search any address or building name to find what&apos;s known.
          </p>
        </div>

        {/* City selector */}
        <div style={{ marginBottom: "16px" }}>
          <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--text-dim)", marginBottom: "12px" }}>
            CITY
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {CITIES.map((c) => (
              <button
                key={c.name}
                onClick={() => setCity(city?.name === c.name ? null : c)}
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.1em",
                  padding: "8px 18px",
                  background: city?.name === c.name ? "var(--text)" : "none",
                  border: "1px solid var(--border)",
                  cursor: "pointer",
                  color: city?.name === c.name ? "var(--bg)" : "var(--text-muted)",
                  transition: "all 0.2s",
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                }}
                onMouseEnter={(e) => {
                  if (city?.name !== c.name) {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--text-muted)";
                    (e.currentTarget as HTMLElement).style.color = "var(--text)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (city?.name !== c.name) {
                    (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
                    (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                  }
                }}
              >
                {c.name.toUpperCase()}
              </button>
            ))}
            {city && (
              <button
                onClick={() => setCity(null)}
                style={{
                  fontSize: "10px",
                  letterSpacing: "0.1em",
                  padding: "8px 14px",
                  background: "none",
                  border: "1px solid var(--border-dim)",
                  cursor: "pointer",
                  color: "var(--text-dim)",
                  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                  transition: "all 0.2s",
                }}
              >
                ✕ CLEAR
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div style={{ maxWidth: "640px", marginBottom: "120px", position: "relative" }}>
          <div style={{
            border: `1px solid ${focused ? "var(--text-muted)" : "var(--border)"}`,
            transition: "border-color 0.2s",
            display: "flex",
          }}>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => {
                setFocused(true);
                if (suggestions.length > 0) setShowSuggestions(true);
              }}
              onBlur={() => {
                setFocused(false);
                setTimeout(() => setShowSuggestions(false), 150);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
                if (e.key === "Escape") setShowSuggestions(false);
              }}
              placeholder={city
                ? `ADDRESS OR BUILDING NAME IN ${city.name.toUpperCase()}`
                : "ADDRESS, ARCHITECT, OR BUILDING NAME"}
              style={{
                flex: 1,
                fontSize: "11px",
                letterSpacing: "0.08em",
                padding: "20px 24px",
                background: "none",
                border: "none",
                outline: "none",
                color: "var(--text)",
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              }}
            />
            <button
              onClick={handleSearch}
              style={{
                fontSize: "10px",
                letterSpacing: "0.1em",
                padding: "20px 28px",
                background: "none",
                border: "none",
                borderLeft: "1px solid var(--border)",
                cursor: "pointer",
                color: "var(--text)",
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.5"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              SEARCH
            </button>
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              background: "var(--bg)",
              border: "1px solid var(--border)",
              borderTop: "none",
              zIndex: 100,
              boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
            }}>
              {suggestions.map((s) => (
                <button
                  key={s.id}
                  onMouseDown={() => handleSuggestionClick(s)}
                  style={{
                    display: "block",
                    width: "100%",
                    padding: "14px 20px",
                    background: "none",
                    border: "none",
                    borderBottom: "1px solid var(--border-dim)",
                    cursor: "pointer",
                    textAlign: "left",
                    fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    transition: "background 0.15s",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--bg-alt)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                >
                  <div style={{ fontSize: "12px", letterSpacing: "0.04em", color: "var(--text)", marginBottom: "3px" }}>
                    {s.name}
                  </div>
                  {s.description && (
                    <div style={{ fontSize: "9px", letterSpacing: "0.08em", color: "var(--text-dim)" }}>
                      {s.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          <div style={{ marginTop: "12px", fontSize: "9px", letterSpacing: "0.12em", color: "var(--text-dim)" }}>
            {city
              ? `SEARCHING IN ${city.name.toUpperCase()}, ${city.state} · PRESS / TO FOCUS`
              : "PRESS / TO FOCUS · SELECT A CITY TO NARROW RESULTS"}
          </div>
        </div>

        {/* Stats */}
        <div style={{ borderTop: "1px solid var(--border-dim)", paddingTop: "40px", display: "flex", gap: "60px", flexWrap: "wrap" }}>
          {[
            { value: "Wikidata", label: "PRIMARY SOURCE" },
            { value: "OpenStreetMap", label: "GEOCODING" },
            { value: "Overpass", label: "BUILDING DATA" },
            { value: "OPEN", label: "DATA" },
          ].map(({ value, label }) => (
            <div key={label}>
              <div style={{ fontSize: "13px", fontWeight: 300, letterSpacing: "0.05em", marginBottom: "6px" }}>{value}</div>
              <div style={{ fontSize: "8px", letterSpacing: "0.18em", color: "var(--text-dim)" }}>{label}</div>
            </div>
          ))}
        </div>

      </main>
    </div>
  );
}