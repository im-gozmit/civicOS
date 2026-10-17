"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import type { Map as LeafletMap, CircleMarker } from "leaflet";

export interface LatLng {
  lat: number;
  lng: number;
}

// Prayagraj city centre; the map opens here until the citizen picks a spot or uses GPS.
const DEFAULT_CENTER: LatLng = { lat: 25.4358, lng: 81.8463 };

export function LocationPicker({
  value,
  onChange,
  flyTo,
}: {
  value: LatLng | null;
  onChange: (p: LatLng) => void;
  flyTo?: LatLng | null; // changes when "use my location" returns a position
}) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const marker = useRef<CircleMarker | null>(null);
  const leaflet = useRef<typeof import("leaflet") | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Create the map once (Leaflet touches `window`, so it is imported only in the browser).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !el.current || map.current) return;
      leaflet.current = L;
      const start = value ?? DEFAULT_CENTER;
      const m = L.map(el.current).setView([start.lat, start.lng], 15);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap contributors",
      }).addTo(m);
      m.on("click", (e) => onChangeRef.current({ lat: e.latlng.lat, lng: e.latlng.lng }));
      map.current = m;
      if (value) marker.current = L.circleMarker([value.lat, value.lng], { radius: 9, color: "#cf3d0f", fillOpacity: 0.7 }).addTo(m);
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      marker.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the marker in sync with the chosen location.
  useEffect(() => {
    const L = leaflet.current;
    const m = map.current;
    if (!L || !m || !value) return;
    if (marker.current) marker.current.setLatLng([value.lat, value.lng]);
    else marker.current = L.circleMarker([value.lat, value.lng], { radius: 9, color: "#cf3d0f", fillOpacity: 0.7 }).addTo(m);
  }, [value]);

  useEffect(() => {
    if (flyTo && map.current) map.current.setView([flyTo.lat, flyTo.lng], 17);
  }, [flyTo]);

  return <div ref={el} className="h-72 w-full sm:h-80" role="application" aria-label="Map: tap to mark the problem location" />;
}
