import React from "react";
import Link from "next/link";
import Header from "@/components/Header";
import MapWrapper from "@/components/MapWrapper";
import { fetchByAddress } from "@/lib/fetchByAddress";

function FactRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "180px 1fr", gap: "20px", padding: "14px 0", borderBottom: "1px solid var(--border-dim)" }}>
      <div style={{ fontSize: "9px", letterSpacing: "0.12em", color: "var(--text-dim)", paddingTop: "1px" }}>{label}</div>
      <div style={{ fontSize: "12px", letterSpacing: "0.03em", color: "var(--text)", fontWeight: 300 }}>{value}</div>
    </div>
  );
}

function SectionLabel({ title }: { title: string }) {
  return (
    <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--text-dim)", marginBottom: "4px", marginTop: "32px", paddingBottom: "10px", borderBottom: "1px solid var(--border)" }}>
      {title}
    </div>
  );
}

export default async function AddressPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  if (!q) return null;

  const building = await fetchByAddress(q);

  if (!building) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)" }}>
        <Header />
        <main style={{ maxWidth: "1200px", margin: "0 auto", padding: "60px 40px" }}>
          <div style={{ fontSize: "11px", letterSpacing: "0.1em", color: "var(--text-dim)" }}>
            ADDRESS NOT FOUND — <Link href="/" style={{ color: "var(--text-muted)", textDecoration: "none" }}>TRY AGAIN</Link>
          </div>
        </main>
      </div>
    );
  }

  const hasDetail = building.year_built || building.building_type || building.architect ||
    building.levels || building.height_m || building.material || building.heritage ||
    building.historic || building.operator || building.roof_shape;

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
              <span style={{ fontSize: "9px", letterSpacing: "0.1em", padding: "6px 12px", border: "1px solid var(--border)", color: "var(--text-dim)" }}>
                OSM
              </span>
              {building.wikidataId && (
                <Link
                  href={`/building/${building.wikidataId}`}
                  style={{ fontSize: "9px", letterSpacing: "0.1em", padding: "6px 12px", border: "1px solid var(--border)", color: "var(--text)", textDecoration: "none" }}
                >
                  VIEW FULL RECORD →
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Two-column layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", marginBottom: "80px" }}>
          <div>
            {hasDetail ? (
              <>
                <SectionLabel title="BUILDING DATA" />
                <FactRow label="YEAR BUILT" value={building.year_built?.toString()} />
                <FactRow label="TYPE" value={building.building_type} />
                <FactRow label="FLOORS" value={building.levels?.toString()} />
                <FactRow label="HEIGHT" value={building.height_m ? `${building.height_m} m` : null} />
                <FactRow label="ARCHITECT" value={building.architect} />
                <FactRow label="OPERATOR" value={building.operator} />
                <FactRow label="MATERIAL" value={building.material} />
                <FactRow label="ROOF MATERIAL" value={building.roof_material} />
                <FactRow label="ROOF SHAPE" value={building.roof_shape} />
                <FactRow label="HERITAGE" value={building.heritage} />
                <FactRow label="HISTORIC" value={building.historic} />
                <FactRow label="RELIGION" value={building.religion} />
                <FactRow label="DENOMINATION" value={building.denomination} />
                {building.description && (
                  <div style={{ padding: "14px 0", borderBottom: "1px solid var(--border-dim)", fontSize: "11px", letterSpacing: "0.02em", color: "var(--text-muted)", lineHeight: 1.7 }}>
                    {building.description}
                  </div>
                )}
              </>
            ) : (
              <div style={{ paddingTop: "20px" }}>
                <div style={{ fontSize: "11px", letterSpacing: "0.05em", color: "var(--text-dim)", lineHeight: 1.8, marginBottom: "32px" }}>
                  No architectural data found for this address in OpenStreetMap.
                  This is common for residential buildings — property records are held by county assessors and are not publicly available through a free API.
                </div>
                <div style={{ fontSize: "9px", letterSpacing: "0.12em", color: "var(--text-dim)", marginBottom: "16px" }}>WHERE TO FIND MORE</div>
                {[
                  { label: "County Assessor", note: "Search your county assessor's website for year built, owner, and tax records" },
                  { label: "Zillow / Redfin", note: "Often shows year built, square footage, and renovation history" },
                  { label: "HABS / HAER", note: "Historic American Buildings Survey — detailed records for historic structures" },
                  { label: "Local Landmarks Commission", note: "City landmark databases often include architect and construction history" },
                ].map((item) => (
                  <div key={item.label} style={{ padding: "14px 0", borderBottom: "1px solid var(--border-dim)" }}>
                    <div style={{ fontSize: "10px", letterSpacing: "0.1em", color: "var(--text)", marginBottom: "4px" }}>{item.label}</div>
                    <div style={{ fontSize: "10px", letterSpacing: "0.03em", color: "var(--text-dim)", lineHeight: 1.6 }}>{item.note}</div>
                  </div>
                ))}
              </div>
            )}

            {/* External links */}
            <div style={{ marginTop: "32px", display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {building.osmId && (
                <a href={`https://www.openstreetmap.org/${building.osmId}`} target="_blank" rel="noreferrer"
                  style={{ fontSize: "9px", letterSpacing: "0.1em", padding: "6px 12px", border: "1px solid var(--border)", color: "var(--text-muted)", textDecoration: "none", display: "inline-block" }}>
                  OPENSTREETMAP ↗
                </a>
              )}
              {building.wikidataId && (
                <a href={`https://www.wikidata.org/wiki/${building.wikidataId}`} target="_blank" rel="noreferrer"
                  style={{ fontSize: "9px", letterSpacing: "0.1em", padding: "6px 12px", border: "1px solid var(--border)", color: "var(--text-muted)", textDecoration: "none", display: "inline-block" }}>
                  WIKIDATA ↗
                </a>
              )}
              {building.wikipedia && (
                <a href={building.wikipedia} target="_blank" rel="noreferrer"
                  style={{ fontSize: "9px", letterSpacing: "0.1em", padding: "6px 12px", border: "1px solid var(--border)", color: "var(--text-muted)", textDecoration: "none", display: "inline-block" }}>
                  WIKIPEDIA ↗
                </a>
              )}
              {building.website && (
                <a href={building.website} target="_blank" rel="noreferrer"
                  style={{ fontSize: "9px", letterSpacing: "0.1em", padding: "6px 12px", border: "1px solid var(--border)", color: "var(--text-muted)", textDecoration: "none", display: "inline-block" }}>
                  WEBSITE ↗
                </a>
              )}
            </div>

            {/* Contribute */}
            <div style={{ marginTop: "48px", padding: "24px", border: "1px solid var(--border-dim)", background: "var(--bg-alt)" }}>
              <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--text-dim)", marginBottom: "10px" }}>KNOW MORE?</div>
              <div style={{ fontSize: "11px", letterSpacing: "0.03em", color: "var(--text-muted)", lineHeight: 1.7 }}>
                If you know the architect, year built, or other details for this building, you can add them to OpenStreetMap and they&apos;ll appear here automatically.
              </div>
              <a href={`https://www.openstreetmap.org/edit`} target="_blank" rel="noreferrer"
                style={{ display: "inline-block", marginTop: "16px", fontSize: "9px", letterSpacing: "0.1em", padding: "8px 16px", border: "1px solid var(--border)", color: "var(--text)", textDecoration: "none" }}>
                EDIT ON OPENSTREETMAP ↗
              </a>
            </div>
          </div>

          {/* Map */}
          <div>
            <div style={{ fontSize: "9px", letterSpacing: "0.2em", color: "var(--text-dim)", marginBottom: "24px" }}>LOCATION</div>
            <MapWrapper lat={building.lat} lng={building.lng} name={building.name ?? building.address} nearbyBuildings={[]} height="360px" />
            <div style={{ marginTop: "12px", fontSize: "9px", letterSpacing: "0.08em", color: "var(--text-dim)" }}>
              {building.lat.toFixed(6)}, {building.lng.toFixed(6)}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
