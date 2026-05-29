"use client";

import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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

        {/* Search */}
        <div style={{ maxWidth: "640px", marginBottom: "120px" }}>
          <div style={{ border: `1px solid ${focused ? "var(--text-muted)" : "var(--border)"}`, transition: "border-color 0.2s", display: "flex" }}>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && query.trim()) {
                  window.location.href = `/search?q=${encodeURIComponent(query)}`;
                }
              }}
              placeholder="375 PARK AVENUE, NEW YORK — OR — FALLINGWATER"
              style={{ flex: 1, fontSize: "11px", letterSpacing: "0.08em", padding: "20px 24px", background: "none", border: "none", outline: "none", color: "var(--text)", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
            />
            <button
              onClick={() => { if (query.trim()) window.location.href = `/search?q=${encodeURIComponent(query)}`; }}
              style={{ fontSize: "10px", letterSpacing: "0.1em", padding: "20px 28px", background: "none", border: "none", borderLeft: "1px solid var(--border)", cursor: "pointer", color: "var(--text)", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", transition: "opacity 0.2s" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.5"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              SEARCH
            </button>
          </div>
          <div style={{ marginTop: "12px", fontSize: "9px", letterSpacing: "0.12em", color: "var(--text-dim)" }}>
            PRESS / TO FOCUS · SEARCH BY ADDRESS, BUILDING NAME, OR ARCHITECT
          </div>
        </div>

        {/* Stats */}
        <div style={{ borderTop: "1px solid var(--border-dim)", paddingTop: "40px", display: "flex", gap: "60px" }}>
          {[
            { value: "Wikidata", label: "PRIMARY SOURCE" },
            { value: "OpenStreetMap", label: "GEOCODING" },
            { value: "SPARQL", label: "QUERY ENGINE" },
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
