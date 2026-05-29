"use client";

import { useEffect, useRef } from "react";

interface MapProps {
  lat: number;
  lng: number;
  name?: string | null;
  nearbyBuildings?: Array<{
    id: string;
    lat: number;
    lng: number;
    name?: string | null;
    address: string;
  }>;
  height?: string;
}

export default function BuildingMap({
  lat,
  lng,
  name,
  nearbyBuildings = [],
  height = "400px",
}: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<ReturnType<typeof import("leaflet")["map"]> | null>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Dynamic import — Leaflet is browser-only
    import("leaflet").then((L) => {
      // CartoDB Positron — monochrome, minimal, fits CARLISLE palette perfectly
      const map = L.map(mapRef.current!, {
        center: [lat, lng],
        zoom: 16,
        zoomControl: true,
        attributionControl: true,
      });

      mapInstanceRef.current = map;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
          subdomains: "abcd",
          maxZoom: 20,
        }
      ).addTo(map);

      // Custom minimal marker
      const primaryIcon = L.divIcon({
        className: "",
        html: `<div style="
          width: 10px;
          height: 10px;
          background: #000;
          border: 2px solid #fff;
          box-shadow: 0 0 0 1px #000;
        "></div>`,
        iconSize: [10, 10],
        iconAnchor: [5, 5],
      });

      const secondaryIcon = L.divIcon({
        className: "",
        html: `<div style="
          width: 6px;
          height: 6px;
          background: #999;
          border: 1px solid #fff;
          box-shadow: 0 0 0 1px #ccc;
        "></div>`,
        iconSize: [6, 6],
        iconAnchor: [3, 3],
      });

      // Main building marker
      L.marker([lat, lng], { icon: primaryIcon })
        .addTo(map)
        .bindPopup(name || "Building")
        .openPopup();

      // Nearby buildings
      nearbyBuildings.forEach((b) => {
        if (b.lat === lat && b.lng === lng) return;
        L.marker([b.lat, b.lng], { icon: secondaryIcon })
          .addTo(map)
          .bindPopup(
            `<a href="/building/${b.id}" style="color:#000;text-decoration:none;letter-spacing:0.05em">${b.name || b.address}</a>`
          );
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [lat, lng, name, nearbyBuildings]);

  return (
    <div
      ref={mapRef}
      style={{ width: "100%", height, border: "1px solid var(--border)" }}
    />
  );
}
