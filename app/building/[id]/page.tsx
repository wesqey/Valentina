import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import MapWrapper from "@/components/MapWrapper";
import { fetchBuilding } from "@/lib/fetchBuilding";
import { notFound } from "next/navigation";

const NEARBY_BUILDINGS: Array<{ id: string; name: string; address: string; lat: number; lng: number }> = [];

const externalLinkStyle: React.CSSProperties = {
  fontSize: "9px",
  letterSpacing: "0.1em",
  padding: "6px 12px",
  border: "1px solid var(--border)",
  color: "var(--text-muted)",
  textDecoration: "none",
  display: "inline-block",
};

function FactRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "20px", padding: "14px 0", borderBottom: "1px solid var(--border-dim)" }}>
      <div style={{ fontSize: "9px", letterSpacing: "0.12em", color: "var(--text-dim)", paddingTop: "1px" }}>{label}</div>
      <div style={{ fontSize: "12px", letterSpacing: "0.03em", color: "var(--text)", fontWeight: 300 }}>{value}</div>
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--text-dim)", marginBottom: "4px", marginTop: "32px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
      {title}
    </div>
  );
}

export default async function BuildingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const building = await fetchBuilding(id);
  if (!building) notFound();

  const nearby = NEARBY_BUILDINGS;

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
      <Header />

      <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 40px" }}>
        {/* Breadcrumb */}
        <div style={{ fontSize: "9px", letterSpacing: "0.15em", color: "var(--text-dim)", marginBottom: "40px", display: "flex", gap: "16px", alignItems: "center" }}>
          <Link href="/" style={{ color: "var(--text-dim)", textDecoration: "none" }}>VALENTINA</Link>
          <span>—</span>
          {building.city && <span>{building.city.toUpperCase()}</span>}
          {building.city && <span>—</span>}
          <span style={{ color: "var(--text-muted)" }}>{(building.name ?? building.address).toUpperCase()}</span>
        </div>

        {/* Title */}
        <div style={{ borderBottom: "1px solid var(--border)", paddingBottom: "40px", marginBottom: "60px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "40px", flexWrap: "wrap" }}>
            <div>
              <h1 style={{ fontSize: "36px", fontWeight: 300, letterSpacing: "0.08em", margin: "0 0 12px", lineHeight: 1.1 }}>
                {building.name ?? building.address}
              </h1>
              <div style={{ fontSize: "12px", letterSpacing: "0.08em", color: "var(--text-muted)" }}>
                {[building.address, building.city, building.country].filter(Boolean).join(", ")}
              </div>
            </div>
            <div style={{ display: "flex", gap: "12px", flexShrink: 0 }}>
              {building.verified && (
                <span style={{ fontSize: "9px", letterSpacing: "0.1em", padding: "6px 12px", border: "1px solid var(--border)", color: "var(--text-dim)" }}>VERIFIED</span>
              )}
              <Link href={`/building/${building.id}/edit`} style={{ fontSize: "9px", letterSpacing: "0.1em", padding: "6px 12px", border: "1px solid var(--border)", color: "var(--text)", textDecoration: "none" }}>
                EDIT
              </Link>
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", marginBottom: "80px" }}>

          {/* Left: All facts */}
          <div>
            <SectionHeader title="IDENTITY" />
            <FactRow label="ARCHITECT" value={building.architect} />
            <FactRow label="FIRM" value={building.firm} />
            <FactRow label="YEAR BUILT" value={building.year_built?.toString()} />
            <FactRow label="YEAR DEMOLISHED" value={building.year_demolished?.toString()} />
            <FactRow label="STYLE" value={building.style} />
            <FactRow label="MOVEMENT" value={building.movement} />
            <FactRow label="USE" value={building.use_type} />

            <SectionHeader title="PHYSICAL" />
            <FactRow label="HEIGHT" value={building.height_m ? `${building.height_m} m` : null} />
            <FactRow label="FLOORS" value={building.floors?.toString()} />
            <FactRow label="FLOOR AREA" value={building.floor_area_m2 ? `${building.floor_area_m2.toLocaleString()} m²` : null} />
            <FactRow label="SITE AREA" value={building.site_area_m2 ? `${building.site_area_m2.toLocaleString()} m²` : null} />
            <FactRow label="UNITS" value={building.units?.toString()} />
            <FactRow label="STRUCTURAL SYSTEM" value={building.structural_system} />
            <FactRow label="MATERIALS" value={building.materials?.join(", ")} />

            <SectionHeader title="SUSTAINABILITY" />
            <FactRow label="LEED RATING" value={building.leed_rating} />
            <FactRow label="BREEAM RATING" value={building.breeam_rating} />
            <FactRow label="ENERGY RATING" value={building.energy_rating} />
            <FactRow label="CARBON FOOTPRINT" value={building.carbon_footprint} />
            {building.sustainability_notes && (
              <div style={{ padding: "14px 0", borderBottom: "1px solid var(--border-dim)", fontSize: "11px", letterSpacing: "0.02em", color: "var(--text-muted)", lineHeight: 1.7 }}>
                {building.sustainability_notes}
              </div>
            )}

            <SectionHeader title="RECOGNITION" />
            <FactRow label="HERITAGE STATUS" value={building.heritage_status} />
            <FactRow label="LISTED GRADE" value={building.listed_grade} />
            {building.awards && building.awards.length > 0 && (
              <div style={{ paddingTop: "8px" }}>
                {building.awards.map((a, i) => (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "20px", padding: "14px 0", borderBottom: "1px solid var(--border-dim)" }}>
                    <div style={{ fontSize: "9px", letterSpacing: "0.12em", color: "var(--text-dim)", paddingTop: "1px" }}>
                      {a.year ?? "AWARD"}
                    </div>
                    <div style={{ fontSize: "12px", letterSpacing: "0.03em", color: "var(--text)", fontWeight: 300 }}>
                      {a.name}
                      {a.organization && <span style={{ color: "var(--text-dim)", fontSize: "10px" }}> — {a.organization}</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Sources */}
            {building.sources && building.sources.length > 0 && (
              <>
                <SectionHeader title="SOURCES" />
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", paddingTop: "8px" }}>
                  {building.sources.map((s, i) => (
                    <div key={i}>
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noreferrer" style={{ fontSize: "10px", letterSpacing: "0.05em", color: "var(--text-muted)", textDecoration: "none", borderBottom: "1px solid var(--border)" }}>
                          {s.label} ↗
                        </a>
                      ) : (
                        <span style={{ fontSize: "10px", letterSpacing: "0.05em", color: "var(--text-dim)" }}>{s.label}</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* External links */}
            <div style={{ marginTop: "32px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {building.wikidata_id && (
                <a href={`https://www.wikidata.org/wiki/${building.wikidata_id}`} target="_blank" rel="noreferrer" style={externalLinkStyle}>WIKIDATA ↗</a>
              )}
              {building.osm_id && (
                <a href={`https://www.openstreetmap.org/${building.osm_id}`} target="_blank" rel="noreferrer" style={externalLinkStyle}>OPENSTREETMAP ↗</a>
              )}
            </div>
          </div>

          {/* Right: Map + nearby */}
          <div>
            <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--text-dim)", marginBottom: "24px" }}>LOCATION</div>
            {building.lat !== 0 && building.lng !== 0 ? (
              <>
                <MapWrapper lat={building.lat} lng={building.lng} name={building.name} nearbyBuildings={nearby} height="360px" />
                <div style={{ marginTop: "12px", fontSize: "9px", letterSpacing: "0.08em", color: "var(--text-dim)" }}>
                  {building.lat.toFixed(6)}, {building.lng.toFixed(6)}
                </div>
              </>
            ) : (
              <div style={{ height: "360px", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", letterSpacing: "0.15em", color: "var(--text-dim)" }}>
                NO COORDINATES
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        {building.description && (
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "60px", marginBottom: "80px" }}>
            <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--text-dim)", marginBottom: "24px" }}>DESCRIPTION</div>
            <p style={{ fontSize: "14px", lineHeight: "1.9", letterSpacing: "0.02em", fontWeight: 300, color: "var(--text)", maxWidth: "680px", margin: 0 }}>
              {building.description}
            </p>
          </div>
        )}

        {/* Images */}
        {building.images && building.images.length > 0 && (
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: "60px", marginBottom: "80px" }}>
            <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--text-dim)", marginBottom: "24px" }}>IMAGES</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
              {building.images.map((img, i) => (
                <div key={i}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.caption ?? building.name ?? "Building"} style={{ width: "100%", display: "block", border: "1px solid var(--border)" }} />
                  {(img.caption ?? img.credit) && (
                    <div style={{ marginTop: "8px", fontSize: "9px", letterSpacing: "0.08em", color: "var(--text-dim)" }}>
                      {img.caption}{img.caption && img.credit && " — "}{img.credit}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit CTA */}
        <div style={{ borderTop: "1px solid var(--border)", paddingTop: "60px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--text-dim)", marginBottom: "8px" }}>CONTRIBUTE</div>
            <div style={{ fontSize: "12px", letterSpacing: "0.03em", color: "var(--text-muted)" }}>
              Know something we don&apos;t? Edit this record.
            </div>
          </div>
          <Link href={`/building/${building.id}/edit`} style={{ fontSize: "10px", letterSpacing: "0.12em", padding: "12px 28px", border: "1px solid var(--border)", color: "var(--text)", textDecoration: "none", display: "inline-block" }}>
            EDIT RECORD
          </Link>
        </div>
      </main>
    </div>
  );
}
