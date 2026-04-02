"use client";

// NOTE: Leaflet CSS must be imported globally — done in globals.css overrides.
// Dynamic import is used in pages to avoid SSR issues with Leaflet.

import { useEffect, useRef } from "react";
import type { Map as LeafletMap } from "leaflet";
import type { LocationPoint } from "@/types";
import { EmptyState } from "@/components/ui";

interface RouteMapProps {
  points: LocationPoint[];
  className?: string;
}

export function RouteMap({ points, className = "h-64 w-full rounded-2xl" }: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);

  // NOTE: useEffect must be called before any conditional returns (Rules of Hooks)
  useEffect(() => {
    if (typeof window === "undefined" || !containerRef.current || points.length === 0) return;

    (async () => {
      const L = await import("leaflet");

      // Destroy existing map instance
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const center: [number, number] = [points[0].latitude, points[0].longitude];

      const map = L.map(containerRef.current!, {
        center,
        zoom: 13,
        zoomControl: true,
        attributionControl: true,
      });
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        className: "map-tiles",
      }).addTo(map);

      if (points.length > 1) {
        const latLngs = points.map(
          (p): [number, number] => [p.latitude, p.longitude]
        );
        L.polyline(latLngs, {
          color: "#c0c1ff",
          weight: 3,
          opacity: 0.85,
        }).addTo(map);

        // Start marker
        L.circleMarker(latLngs[0], {
          radius: 6,
          fillColor: "#81c784",
          color: "#ffffff",
          weight: 2,
          opacity: 1,
          fillOpacity: 1,
        }).addTo(map);

        // End marker
        L.circleMarker(latLngs[latLngs.length - 1], {
          radius: 6,
          fillColor: "#ffb4ab",
          color: "#ffffff",
          weight: 2,
          opacity: 1,
          fillOpacity: 1,
        }).addTo(map);

        map.fitBounds(L.latLngBounds(latLngs), { padding: [20, 20] });
      }
    })();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [points]);

  if (points.length === 0) {
    return (
      <EmptyState
        title="No route data available"
        description="GPS location data is not available for this session."
      />
    );
  }

  return <div ref={containerRef} className={className} />;
}
