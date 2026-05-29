"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import Header from "@/components/Header";
import { Building } from "@/types";
import { use } from "react";

// Map is client-only (Leaflet)
const BuildingMap = dynamic(() => import("@/components/BuildingMap"), {
  ssr: false,
});

const NEARBY_BUILDINGS = [
  { id: "nearby-1", name: "Lever House", address: "390 Park Avenue", lat: 40.7601, lng: -73.9719 },
  { id: "nearby-2", name: "Racquet and Tennis Club", address: "370 Park Avenue", lat: 40.757, lng: -73.9735 },
];

const MOCK_BUILDINGS: Record<string, Building> = {
  seagram: {
    id: "seagram",
    name: "Seagram Building",
    address: "375 Park Avenue",
    city: "New York",
    country: "US",
    lat: 40.7583,
    lng: -73.9728,
    year_built: 1958,
    year_demolished: null,
    architect: "Ludwig Mies van der Rohe",
    firm: "Mies van der Rohe & Philip Johnson",
    style: "International Style",
    height_m: 156.7,
    floors: 38,
    use_type: "Commercial",
    materials: ["Bronze", "Glass", "Travertine"],
    description:
      "A landmark of the International Style, the Seagram Building set the standard for corporate skyscrapers. Mies van der Rohe's use of bronze-clad curtain wall, floor-to-ceiling glass, and the raised plaza on Park Avenue created a model that influenced office building design for decades. The building is recessed from the street, creating a public plaza — a then-radical gesture that shaped New York's zoning laws.",
    osm_id: "way/362225005",
    wikidata_id: "Q641483",
    verified: true,
    images: [
      {
        url: "https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/SeagramBuilding.jpg/800px-SeagramBuilding.jpg",
        caption: "South facade on Park Avenue",
        credit: "Wikimedia Commons",
      },
    ],
    sources: [
      {
        label: "Wikidata",
        url: "https://www.wikidata.org/wiki/Q641483",
      },
      {
        label: "AIA Guide to New York City",
        url: null,
      },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
};

async function getNearbyBuildings(lat: number, lng: number, excludeId: string) {
  return NEARBY_BUILDINGS;
}

export default function BuildingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const building = MOCK_BUILDINGS[id] || MOCK_BUILDINGS["seagram"];
  const nearby = NEARBY_BUILDINGS;
  if (!building) return null;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg)",
        color: "var(--text)",
      }}
    >
      <Header />

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 40px" }}>
        {/* Breadcrumb */}
        <div
          style={{
            fontSize: "9px",
            letterSpacing: "0.15em",
            color: "var(--text-dim)",
            marginBottom: "40px",
            display: "flex",
            gap: "16px",
            alignItems: "center",
          }}
        >
          <Link href="/" style={{ color: "var(--text-dim)", textDecoration: "none" }}>
            VALENTINA
          </Link>
          <span>—</span>
          <span>{building.city.toUpperCase()}</span>
          <span>—</span>
          <span style={{ color: "var(--text-muted)" }}>
            {(building.name || building.address).toUpperCase()}
          </span>
        </div>

        {/* Title block */}
        <div
          style={{
            borderBottom: "1px solid var(--border)",
            paddingBottom: "40px",
            marginBottom: "60px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: "40px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "36px",
                  fontWeight: 300,
                  letterSpacing: "0.08em",
                  margin: "0 0 12px",
                  lineHeight: 1.1,
                }}
              >
                {building.name || building.address}
              </h1>
              <div
                style={{
                  fontSize: "12px",
                  letterSpacing: "0.08em",
                  color: "var(--text-muted)",
                }}
              >
                {building.address}, {building.city}, {building.country}
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", flexShrink: 0 }}>
              {building.verified && (
                <span
                  style={{
                    fontSize: "9px",
                    letterSpacing: "0.1em",
                    padding: "6px 12px",
                    border: "1px solid var(--border)",
                    color: "var(--text-dim)",
                  }}
                >
                  VERIFIED
                </span>
              )}
              <Link
                href={`/building/${building.id}/edit`}
                style={{
                  fontSize: "9px",
                  letterSpacing: "0.1em",
                  padding: "6px 12px",
                  border: "1px solid var(--border)",
                  color: "var(--text)",
                  textDecoration: "none",
                  transition: "border-color 0.2s",
                }}
                onMouseEnter={(e) =>
                  ((e.target as HTMLElement).style.borderColor = "var(--text-muted)")
                }
                onMouseLeave={(e) =>
                  ((e.target as HTMLElement).style.borderColor = "var(--border)")
                }
              >
                EDIT
              </Link>
            </div>
          </div>
        </div>

        {/* Two-column layout: facts + map */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "80px",
            marginBottom: "80px",
          }}
        >
          {/* Left: Key facts grid */}
          <div>
            <div
              style={{
                fontSize: "9px",
                letterSpacing: "0.2em",
                color: "var(--text-dim)",
                marginBottom: "24px",
              }}
            >
              KEY FACTS
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {[
                { label: "ARCHITECT", value: building.architect },
                { label: "FIRM", value: building.firm },
                { label: "YEAR BUILT", value: building.year_built?.toString() },
                {
                  label: "YEAR DEMOLISHED",
                  value: building.year_demolished?.toString(),
                },
                { label: "STYLE", value: building.style },
                {
                  label: "HEIGHT",
                  value: building.height_m ? `${building.height_m} m` : null,
                },
                {
                  label: "FLOORS",
                  value: building.floors?.toString(),
                },
                { label: "USE", value: building.use_type },
                {
                  label: "MATERIALS",
                  value: building.materials?.join(", "),
                },
              ]
                .filter((f) => f.value)
                .map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "140px 1fr",
                      gap: "20px",
                      padding: "14px 0",
                      borderBottom: "1px solid var(--border-dim)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "9px",
                        letterSpacing: "0.12em",
                        color: "var(--text-dim)",
                        paddingTop: "1px",
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        letterSpacing: "0.03em",
                        color: "var(--text)",
                        fontWeight: 300,
                      }}
                    >
                      {value}
                    </div>
                  </div>
                ))}
            </div>

            {/* Sources */}
            {building.sources && building.sources.length > 0 && (
              <div style={{ marginTop: "40px" }}>
                <div
                  style={{
                    fontSize: "9px",
                    letterSpacing: "0.2em",
                    color: "var(--text-dim)",
                    marginBottom: "16px",
                  }}
                >
                  SOURCES
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {building.sources.map((s, i) => (
                    <div key={i}>
                      {s.url ? (
                        <a
                          href={s.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: "10px",
                            letterSpacing: "0.05em",
                            color: "var(--text-muted)",
                            textDecoration: "none",
                            borderBottom: "1px solid var(--border)",
                          }}
                        >
                          {s.label} ↗
                        </a>
                      ) : (
                        <span
                          style={{
                            fontSize: "10px",
                            letterSpacing: "0.05em",
                            color: "var(--text-dim)",
                          }}
                        >
                          {s.label}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* External links */}
            <div style={{ marginTop: "32px", display: "flex", gap: "12px" }}>
              {building.wikidata_id && (
                <a
                  href={`https://www.wikidata.org/wiki/${building.wikidata_id}`}
                  target="_blank"
                  rel="noreferrer"
                  style={externalLinkStyle}
                >
                  WIKIDATA ↗
                </a>
              )}
              {building.osm_id && (
                <a
                  href={`https://www.openstreetmap.org/${building.osm_id}`}
                  target="_blank"
                  rel="noreferrer"
                  style={externalLinkStyle}
                >
                  OPENSTREETMAP ↗
                </a>
              )}
            </div>
          </div>

          {/* Right: Map */}
          <div>
            <div
              style={{
                fontSize: "9px",
                letterSpacing: "0.2em",
                color: "var(--text-dim)",
                marginBottom: "24px",
              }}
            >
              LOCATION
            </div>
            <BuildingMap
              lat={building.lat}
              lng={building.lng}
              name={building.name}
              nearbyBuildings={nearby}
              height="360px"
            />
            <div
              style={{
                marginTop: "12px",
                fontSize: "9px",
                letterSpacing: "0.08em",
                color: "var(--text-dim)",
              }}
            >
              {building.lat.toFixed(6)}, {building.lng.toFixed(6)}
            </div>

            {/* Nearby */}
            {nearby.length > 0 && (
              <div style={{ marginTop: "32px" }}>
                <div
                  style={{
                    fontSize: "9px",
                    letterSpacing: "0.2em",
                    color: "var(--text-dim)",
                    marginBottom: "16px",
                  }}
                >
                  NEARBY
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
                  {nearby.map((b) => (
                    <Link
                      key={b.id}
                      href={`/building/${b.id}`}
                      style={{
                        display: "block",
                        padding: "12px 0",
                        borderBottom: "1px solid var(--border-dim)",
                        textDecoration: "none",
                        color: "var(--text)",
                        fontSize: "11px",
                        letterSpacing: "0.04em",
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) =>
                        ((e.target as HTMLElement).style.color = "var(--text-muted)")
                      }
                      onMouseLeave={(e) =>
                        ((e.target as HTMLElement).style.color = "var(--text)")
                      }
                    >
                      {b.name || b.address}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {building.description && (
          <div
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: "60px",
              marginBottom: "80px",
            }}
          >
            <div
              style={{
                fontSize: "9px",
                letterSpacing: "0.2em",
                color: "var(--text-dim)",
                marginBottom: "24px",
              }}
            >
              DESCRIPTION
            </div>
            <p
              style={{
                fontSize: "14px",
                lineHeight: "1.9",
                letterSpacing: "0.02em",
                fontWeight: 300,
                color: "var(--text)",
                maxWidth: "680px",
                margin: 0,
              }}
            >
              {building.description}
            </p>
          </div>
        )}

        {/* Images */}
        {building.images && building.images.length > 0 && (
          <div
            style={{
              borderTop: "1px solid var(--border)",
              paddingTop: "60px",
              marginBottom: "80px",
            }}
          >
            <div
              style={{
                fontSize: "9px",
                letterSpacing: "0.2em",
                color: "var(--text-dim)",
                marginBottom: "24px",
              }}
            >
              IMAGES
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: "20px",
              }}
            >
              {building.images.map((img, i) => (
                <div key={i}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.url}
                    alt={img.caption || building.name || "Building"}
                    style={{
                      width: "100%",
                      display: "block",
                      border: "1px solid var(--border)",
                    }}
                  />
                  {(img.caption || img.credit) && (
                    <div
                      style={{
                        marginTop: "8px",
                        fontSize: "9px",
                        letterSpacing: "0.08em",
                        color: "var(--text-dim)",
                      }}
                    >
                      {img.caption}
                      {img.caption && img.credit && " — "}
                      {img.credit}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit CTA */}
        <div
          style={{
            borderTop: "1px solid var(--border)",
            paddingTop: "60px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "9px",
                letterSpacing: "0.2em",
                color: "var(--text-dim)",
                marginBottom: "8px",
              }}
            >
              CONTRIBUTE
            </div>
            <div
              style={{
                fontSize: "12px",
                letterSpacing: "0.03em",
                color: "var(--text-muted)",
              }}
            >
              Know something we don't? Edit this record.
            </div>
          </div>
          <Link
            href={`/building/${building.id}/edit`}
            style={{
              fontSize: "10px",
              letterSpacing: "0.12em",
              padding: "12px 28px",
              border: "1px solid var(--border)",
              color: "var(--text)",
              textDecoration: "none",
              transition: "border-color 0.2s",
              display: "inline-block",
            }}
            onMouseEnter={(e) =>
              ((e.target as HTMLElement).style.borderColor = "var(--text-muted)")
            }
            onMouseLeave={(e) =>
              ((e.target as HTMLElement).style.borderColor = "var(--border)")
            }
          >
            EDIT RECORD
          </Link>
        </div>
      </main>
    </div>
  );
}

const externalLinkStyle: React.CSSProperties = {
  fontSize: "9px",
  letterSpacing: "0.1em",
  padding: "6px 12px",
  border: "1px solid var(--border)",
  color: "var(--text-muted)",
  textDecoration: "none",
  display: "inline-block",
  transition: "border-color 0.2s",
};
