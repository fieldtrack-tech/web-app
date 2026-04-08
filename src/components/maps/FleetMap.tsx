"use client";

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import { EmptyState } from "@/components/ui";

interface FleetMember {
  employeeId: string;
  latitude: number;
  longitude: number;
  employeeName?: string;
  status?: "ACTIVE" | "CLOSED";
}

interface FleetMapProps {
  fleet?: FleetMember[];
  className?: string;
  onMarkerClick?: (member: FleetMember) => void;
}

export function FleetMap({ fleet = [], className = "h-80 w-full rounded-2xl", onMarkerClick }: FleetMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  // NOTE: useEffect must be called before any conditional returns (Rules of Hooks)
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current || fleet.length === 0) return;

    (async () => {
      const L = await import("leaflet");

      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = L.map(containerRef.current!, {
        center: [20, 0],
        zoom: 2,
        zoomControl: true,
      });
      mapRef.current = map;

      // Dark-toned OSM tiles — use dark variant in dark mode, light in light mode
      const isDark = document.documentElement.classList.contains("dark");
      L.tileLayer(
        isDark
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
          attribution: isDark ? "© OpenStreetMap © CARTO" : "© OpenStreetMap contributors",
          subdomains: isDark ? "abcd" : "abc",
          maxZoom: 19,
        }
      ).addTo(map);

      // Read theme colors
      const style = getComputedStyle(document.documentElement);
      const activeColor = style.getPropertyValue("--chart-line-secondary").trim() || "#22c55e";
      const inactiveColor = style.getPropertyValue("--tertiary").trim() || "#f97316";
      const tooltipBg = style.getPropertyValue("--chart-tooltip-bg").trim() || "#1a1a2e";
      const tooltipText = style.getPropertyValue("--map-control-text").trim() || "#e2e8f0";

      fleet.forEach((member) => {
        const color = member.status === "ACTIVE" ? activeColor : inactiveColor;

        const icon = member.status === "ACTIVE"
          ? L.divIcon({
              className: "",
              html: `<div style="position:relative;width:24px;height:24px;">
                <div class="marker-live-ring" style="
                  position:absolute;inset:0;
                  background:${color};
                "></div>
                <div style="
                  position:absolute;inset:2px;
                  border-radius:50%;
                  background:${color};
                  border:2.5px solid rgba(255,255,255,0.95);
                  box-shadow:0 0 14px ${color}cc, 0 0 5px ${color}77;
                "></div>
              </div>`,
              iconAnchor: [12, 12],
            })
          : L.divIcon({
              className: "",
              html: `<div style="
                width:11px;height:11px;
                border-radius:50%;
                background:${color};
                border:2px solid rgba(255,255,255,0.7);
                box-shadow:0 0 6px ${color}66;
                opacity:0.75;
              "></div>`,
              iconAnchor: [5, 5],
            });

        L.marker([member.latitude, member.longitude], { icon })
          .bindPopup(
            `<div style="font-family:var(--font-public-sans,sans-serif);font-size:12px;color:${tooltipText};background:${tooltipBg};padding:8px 12px;border-radius:8px;">
              <strong>${member.employeeName ?? "Employee"}</strong><br/>
              ${member.status ?? "ACTIVE"}
            </div>`,
            { className: "leaflet-popup-themed", closeButton: false }
          )
          .on("click", () => onMarkerClick?.(member))
          .addTo(map);
      });

      if (fleet.length > 0) {
        const bounds = L.latLngBounds(fleet.map((member) => [member.latitude, member.longitude] as [number, number]));
        if (bounds.isValid()) {
          map.fitBounds(bounds.pad(0.2), { maxZoom: 14 });
        }
      }
    })();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [fleet, onMarkerClick]);

  if (fleet.length === 0) {
    return (
      <EmptyState
        title="No live locations"
        description="No active employee coordinates are available right now."
      />
    );
  }

  return <div ref={containerRef} className={className} />;
}
