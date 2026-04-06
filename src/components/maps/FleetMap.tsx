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

      // Dark-toned OSM tiles
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
        {
          attribution: "© OpenStreetMap © CARTO",
          subdomains: "abcd",
          maxZoom: 19,
        }
      ).addTo(map);

      fleet.forEach((member) => {
        const color = member.status === "ACTIVE" ? "#2E7D32" : "#F57C00";
        const icon = L.divIcon({
          className: "",
          html: `<div style="
            width:12px;height:12px;
            border-radius:50%;
            background:${color};
            border:2px solid #ffffff;
            box-shadow:0 0 8px ${color}66;
          "></div>`,
          iconAnchor: [6, 6],
        });

        L.marker([member.latitude, member.longitude], { icon })
          .bindPopup(
            `<div style="font-family:Inter,sans-serif;font-size:12px;color:#dae2fd;background:#171f33;padding:8px 12px;border-radius:8px;">
              <strong>${member.employeeName ?? "Employee"}</strong><br/>
              ${member.status ?? "ACTIVE"}
            </div>`,
            {
              className: "leaflet-popup-dark",
              closeButton: false,
            }
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
