"use client";

import Link from "next/link";
import { useState } from "react";

export default function Header() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  return (
    <header
      style={{
        borderBottom: "1px solid var(--border)",
        padding: "30px 40px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
      }}
    >
      {/* Wordmark */}
      <Link href="/" style={{ textDecoration: "none" }}>
        <div
          style={{
            fontSize: "22px",
            fontWeight: 300,
            letterSpacing: "0.15em",
            color: "var(--text)",
            marginBottom: "6px",
            transition: "opacity 0.2s",
          }}
          onMouseEnter={(e) =>
            ((e.target as HTMLElement).style.opacity = "0.5")
          }
          onMouseLeave={(e) =>
            ((e.target as HTMLElement).style.opacity = "1")
          }
        >
          VALENTINA
        </div>
        <div
          style={{
            fontSize: "9px",
            letterSpacing: "0.2em",
            color: "var(--text-muted)",
            pointerEvents: "none",
          }}
        >
          ARCHITECTURE ARCHIVE
        </div>
      </Link>

      {/* Nav */}
      <nav
        style={{
          display: "flex",
          gap: "28px",
          alignItems: "center",
          paddingTop: "4px",
        }}
      >
        <Link href="/map" style={navStyle}>
          MAP
        </Link>
        <Link href="/contribute" style={navStyle}>
          CONTRIBUTE
        </Link>
        <Link href="/about" style={navStyle}>
          ABOUT
        </Link>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            style={{
              ...navButtonStyle,
              color: searchOpen ? "var(--text)" : "var(--text-muted)",
            }}
          >
            SEARCH
          </button>

          {searchOpen && (
            <>
              <div
                onClick={() => setSearchOpen(false)}
                style={{
                  position: "fixed",
                  inset: 0,
                  zIndex: 98,
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  right: 0,
                  marginTop: "12px",
                  width: "320px",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  zIndex: 99,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                }}
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (query.trim()) {
                      window.location.href = `/search?q=${encodeURIComponent(query)}`;
                    }
                  }}
                  style={{ display: "flex" }}
                >
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="ADDRESS, ARCHITECT, OR BUILDING NAME"
                    style={{
                      flex: 1,
                      fontSize: "10px",
                      letterSpacing: "0.08em",
                      padding: "14px 16px",
                      background: "none",
                      border: "none",
                      outline: "none",
                      color: "var(--text)",
                      fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      fontSize: "10px",
                      letterSpacing: "0.1em",
                      padding: "14px 16px",
                      background: "none",
                      border: "none",
                      borderLeft: "1px solid var(--border)",
                      cursor: "pointer",
                      color: "var(--text)",
                    }}
                  >
                    →
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}

const navStyle: React.CSSProperties = {
  fontSize: "10px",
  letterSpacing: "0.15em",
  color: "var(--text-muted)",
  textDecoration: "none",
  transition: "color 0.2s",
};

const navButtonStyle: React.CSSProperties = {
  fontSize: "10px",
  letterSpacing: "0.15em",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: 0,
  fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
  transition: "color 0.2s",
};
