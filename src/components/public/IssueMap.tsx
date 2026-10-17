"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { LayerGroup, Map as LeafletMap } from "leaflet";

interface Marker {
  key: string;
  lat: number;
  lng: number;
  category: string;
  categoryId: string;
  status: string;
  group: "new" | "working" | "done";
  reportedOn: string;
}

const COLORS = { new: "#d97706", working: "#2563eb", done: "#16a34a" } as const;
const GROUP_LABEL = { new: "Waiting", working: "Being handled", done: "Fixed" } as const;
const CENTER = { lat: 25.4358, lng: 81.8463 }; // Prayagraj

export function IssueMap() {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const leaflet = useRef<typeof import("leaflet") | null>(null);
  const [markers, setMarkers] = useState<Marker[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("all");
  const [group, setGroup] = useState("all");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/v1/map/incidents")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
      .then((d: { markers: Marker[] }) => setMarkers(d.markers))
      .catch(() => setError("Could not load the map data. Please try again."));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !el.current || map.current) return;
      leaflet.current = L;
      const m = L.map(el.current).setView([CENTER.lat, CENTER.lng], 12);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "&copy; OpenStreetMap contributors" }).addTo(m);
      layer.current = L.layerGroup().addTo(m);
      map.current = m;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
      layer.current = null;
    };
  }, []);

  const shown = useMemo(
    () => (markers ?? []).filter((m) => (category === "all" || m.categoryId === category) && (group === "all" || m.group === group)),
    [markers, category, group],
  );
  const categories = useMemo(() => Array.from(new Map((markers ?? []).map((m) => [m.categoryId, m.category])).entries()), [markers]);

  useEffect(() => {
    const L = leaflet.current;
    if (!ready || !L || !layer.current || !map.current) return;
    layer.current.clearLayers();
    for (const m of shown) {
      L.circleMarker([m.lat, m.lng], { radius: 9, color: COLORS[m.group], fillColor: COLORS[m.group], fillOpacity: 0.7, weight: 2 })
        .bindPopup(`<strong>${m.category}</strong><br/>${m.status}<br/><small>Reported ${m.reportedOn}</small>`)
        .addTo(layer.current);
    }
    if (shown.length > 0) {
      map.current.fitBounds(L.latLngBounds(shown.map((m) => [m.lat, m.lng] as [number, number])).pad(0.3), { maxZoom: 15 });
    }
  }, [shown, ready]);

  const counts = {
    new: (markers ?? []).filter((m) => m.group === "new").length,
    working: (markers ?? []).filter((m) => m.group === "working").length,
    done: (markers ?? []).filter((m) => m.group === "done").length,
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label>
          <span className="sr-only">Type of problem</span>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="rounded border border-zinc-300 px-2 py-1.5">
            <option value="all">All problems</option>
            {categories.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Status</span>
          <select value={group} onChange={(e) => setGroup(e.target.value)} className="rounded border border-zinc-300 px-2 py-1.5">
            <option value="all">Any status</option>
            <option value="new">{GROUP_LABEL.new}</option>
            <option value="working">{GROUP_LABEL.working}</option>
            <option value="done">{GROUP_LABEL.done}</option>
          </select>
        </label>
        <span className="text-zinc-500">{markers ? `${shown.length} shown` : "Loading…"}</span>
      </div>

      <div ref={el} className="h-[60vh] w-full rounded border border-zinc-300" role="application" aria-label="Map of reported problems" />

      {error ? (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <ul className="flex flex-wrap gap-4 text-sm">
        {(["new", "working", "done"] as const).map((g) => (
          <li key={g} className="flex items-center gap-2">
            <span className="inline-block h-3 w-3 rounded-full" style={{ background: COLORS[g] }} />
            {GROUP_LABEL[g]} ({counts[g]})
          </li>
        ))}
      </ul>
      <p className="text-xs text-zinc-500">
        Locations are approximate on purpose, to protect people&apos;s privacy. Duplicate and rejected reports are not shown.
        These are reports sent to CivicOS, not an official government record.
      </p>
    </div>
  );
}
