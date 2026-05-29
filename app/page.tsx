"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Header from "@/components/Header";

const FEATURED = [
  { id: "Q1056949", name: "Seagram Building", address: "375 Park Ave, New York", architect: "Mies van der Rohe", year: 1958, style: "International Style" },
  { id: "Q214709", name: "Fallingwater", address: "Mill Run, Pennsylvania", architect: "Frank Lloyd Wright", year: 1939, style: "Organic Architecture" },
  { id: "Q317523", name: "Neue Nationalgalerie", address: "Potsdamer Straße 50, Berlin", architect: "Mies van der Rohe", year: 1968, style: "International Style" },
];

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
      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "100px 40px 80px" }}>
        <div style={{ marginBottom: "80px" }}>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 300, letterSpacing: "0.08em", lineHeight: 1.15, margin: "0 0 20px", maxWidth: "700px" }}>
            ARCHITECTURE,<br />ADDRESSED.
          </h1>
          <p style={{ fontSize: "12px", letterSpacing: "0.06em", color: "var(--text-muted)", lineHeight: 1.8, maxWidth: "460px", margin: 0 }}>
            A building database focused on architectural detail — architect, style, materials, year built. Look up any address, find what&apos;s known, add what isn&apos;t.
          </p>
        </div>

        <div style={{ marginBottom: "100px", maxWidth: "640px" }}>
          <div style={{ border: `1px solid ${focused ? "var(--text-muted)" : "var(--border)"}`, transition: "border-color 0.2s", display: "flex" }}>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => { if (e.key === "Enter" && query.trim()) window.location.href = `/search?q=${encodeURIComponent(query)}`; }}
              placeholder="ENTER AN ADDRESS, ARCHITECT, OR BUILDING NAME"
              style={{ flex: 1, fontSize: "11px", letterSpacing: "0.08em", padding: "18px 20px", background: "none", border: "none", outline: "none", color: "var(--text)", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif" }}
            />
            <button
              onClick={() => { if (query.trim()) window.location.href = `/search?q=${encodeURIComponent(query)}`; }}
              style={{ fontSize: "10px", letterSpacing: "0.1em", padding: "18px 24px", background: "none", border: "none", borderLeft: "1px solid var(--border)", cursor: "pointer", color: "var(--text)", fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif", transition: "opacity 0.2s" }}
            >
              SEARCH
            </button>
          </div>
          <div style={{ marginTop: "10px", fontSize: "9px", letterSpacing: "0.1em", color: "var(--text-dim)" }}>PRESS / TO FOCUS</div>
        </div>

        <div>
          <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--text-dim)", marginBottom: "24px" }}>FEATURED BUILDINGS</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
            {FEATURED.map((b, i) => (
              <Link key={b.id} href={`/building/${b.id}`} style={{ display: "block", padding: "28px", paddingLeft: i === 0 ? "0" : "28px", paddingRight: i === FEATURED.length - 1 ? "0" : "28px", borderBottom: "1px solid var(--border-dim)", borderRight: i < FEATURED.length - 1 ? "1px solid var(--border-dim)" : "none", textDecoration: "none", color: "var(--text)", transition: "opacity 0.2s" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.6")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
              >
                <div style={{ fontSize: "14px", letterSpacing: "0.05em", fontWeight: 300, marginBottom: "10px" }}>{b.name}</div>
                <div style={{ fontSize: "9px", letterSpacing: "0.1em", color: "var(--text-dim)", marginBottom: "6px" }}>{b.architect} · {b.year}</div>
                <div style={{ fontSize: "9px", letterSpacing: "0.08em", color: "var(--text-dim)" }}>{b.style}</div>
              </Link>
            ))}
          </div>
        </div>

        <div style={{ marginTop: "80px", borderTop: "1px solid var(--border-dim)", paddingTop: "32px", display: "flex", gap: "60px" }}>
          {[{ value: "12,400+", label: "BUILDINGS" }, { value: "180+", label: "CITIES" }, { value: "6,200+", label: "ARCHITECTS" }, { value: "OPEN", label: "DATA" }].map(({ value, label }) => (
            <div key={label}>
              <div style={{ fontSize: "20px", fontWeight: 300, letterSpacing: "0.05em", marginBottom: "4px" }}>{value}</div>
              <div style={{ fontSize: "8px", letterSpacing: "0.18em", color: "var(--text-dim)" }}>{label}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
