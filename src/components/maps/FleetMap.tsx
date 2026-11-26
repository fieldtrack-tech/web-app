"use client";

import { useEffect, useRef } from "react";
import * as L from "leaflet";
import { EmptyState } from "@/components/ui";
import type { LiveFleetMember } from "@/hooks/queries/useDashboard";
import { COMPANY_TIMEZONE } from "@/lib/attendance-selfie";

interface FleetMapProps {
  fleet: LiveFleetMember[];
  className?: string;
  selectedEmployeeId?: string | null;
}

function markerIcon(stale: boolean) {
  return L.divIcon({
    className: `rounded-full border-2 border-white shadow-md ${stale ? "bg-slate-500" : "bg-emerald-500"}`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -10],
  });
}

function markerDetails(member: LiveFleetMember) {
  const content = document.createElement("div");
  const name = document.createElement("strong");
  const fix = document.createElement("div");

  name.textContent = member.employeeName;
  fix.textContent = (member.stale ? "GPS delayed · " : "GPS fix · ") + new Date(member.recordedAt).toLocaleString(undefined, { timeZone: COMPANY_TIMEZONE });
  content.append(name, fix);
  return content;
}

function MapView({ fleet, className, selectedEmployeeId }: FleetMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markers = useRef(new Map<string, { marker: L.Marker; stale: boolean; recordedAt: string; employeeName: string }>());
  const visibleMembership = useRef("");

  useEffect(() => {
    if (!container.current) return;

    const instance = L.map(container.current, { center: [20, 0], zoom: 2 });
    map.current = instance;
    const isDark = document.documentElement.classList.contains("dark");
    L.tileLayer(
      isDark
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution: isDark ? "© OpenStreetMap © CARTO" : "© OpenStreetMap contributors",
        subdomains: isDark ? "abcd" : "abc",
        maxZoom: 19,
      },
    ).addTo(instance);

    const currentMarkers = markers.current;
    return () => {
      instance.remove();
      currentMarkers.clear();
      visibleMembership.current = "";
      map.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = map.current;
    if (!instance) return;

    const visible = new Set(fleet.map((member) => member.employeeId));
    markers.current.forEach((entry, id) => {
      if (!visible.has(id)) {
        entry.marker.remove();
        markers.current.delete(id);
      }
    });

    for (const member of fleet) {
      const existing = markers.current.get(member.employeeId);
      const coordinates: L.LatLngTuple = [member.latitude, member.longitude];

      if (!existing) {
        const marker = L.marker(coordinates, { icon: markerIcon(member.stale) })
          .bindPopup(markerDetails(member))
          .addTo(instance);
        markers.current.set(member.employeeId, {
          marker,
          stale: member.stale,
          recordedAt: member.recordedAt,
          employeeName: member.employeeName,
        });
        continue;
      }

      if (!existing.marker.getLatLng().equals(L.latLng(coordinates))) existing.marker.setLatLng(coordinates);
      if (existing.stale !== member.stale) existing.marker.setIcon(markerIcon(member.stale));

      if (existing.recordedAt !== member.recordedAt || existing.stale !== member.stale || existing.employeeName !== member.employeeName) {
        existing.marker.setPopupContent(markerDetails(member));
        existing.recordedAt = member.recordedAt;
        existing.stale = member.stale;
        existing.employeeName = member.employeeName;
      }
    }

    const membership = Array.from(visible).sort().join(",");
    const selected = selectedEmployeeId ? markers.current.get(selectedEmployeeId) : undefined;
    if (selected) {
      const coordinates = selected.marker.getLatLng();
      if (instance.getZoom() < 14) instance.setView(coordinates, 14);
      else if (!instance.getCenter().equals(coordinates)) instance.panTo(coordinates);
      visibleMembership.current = "";
    } else if (visibleMembership.current !== membership) {
      instance.closePopup();
      instance.fitBounds(L.latLngBounds(fleet.map(({ latitude, longitude }) => [latitude, longitude])).pad(0.2), { maxZoom: 14 });
      visibleMembership.current = membership;
    }
  }, [fleet, selectedEmployeeId]);

  return <div ref={container} className={className ?? "h-80 w-full rounded-2xl"} aria-label="Employee location map" />;
}

export function FleetMap(props: FleetMapProps) {
  return props.fleet.length ? <MapView {...props} /> : (
    <EmptyState title="No live locations" description="Locations appear here when employees are checked in and send a GPS fix." />
  );
}
