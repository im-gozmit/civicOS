"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import { AlertCircle, CheckCircle2, Clock, Info, Wrench } from "lucide-react";

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

type Group = Marker["group"];

const COLORS: Record<Group, string> = { new: "#f59e0b", working: "#2563eb", done: "#16a34a" };
const GROUP_LABEL: Record<Group, string> = { new: "Waiting", working: "Being handled", done: "Fixed" };
const GROUP_ICON = { new: Clock, working: Wrench, done: CheckCircle2 } as const;
const CENTER = { lat: 25.4358, lng: 81.8463 }; // Prayagraj

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);
}

export function IssueMap() {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const layer = useRef<LayerGroup | null>(null);
  const leaflet = useRef<typeof import("leaflet") | null>(null);
  const [markers, setMarkers] = useState<Marker[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("all");
  const [group, setGroup] = useState<"all" | Group>("all");
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
      const m = L.map(el.current, { scrollWheelZoom: false }).setView([CENTER.lat, CENTER.lng], 12);
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
      L.circleMarker([m.lat, m.lng], { radius: 10, color: "#ffffff", weight: 2.5, fillColor: COLORS[m.group], fillOpacity: 0.95 })
        .bindPopup(
          `<strong style="font-size:15px">${esc(m.category)}</strong><br/><span style="color:${COLORS[m.group]};font-weight:600">${esc(m.status)}</span><br/><small style="color:#64748b">Reported ${esc(m.reportedOn)}</small>`,
        )
        .addTo(layer.current);
    }
    if (shown.length > 0) {
      map.current.fitBounds(L.latLngBounds(shown.map((m) => [m.lat, m.lng] as [number, number])).pad(0.3), { maxZoom: 15 });
    }
  }, [shown, ready]);

  const counts: Record<Group, number> = {
    new: (markers ?? []).filter((m) => m.group === "new").length,
    working: (markers ?? []).filter((m) => m.group === "working").length,
    done: (markers ?? []).filter((m) => m.group === "done").length,
  };

  const chip = (active: boolean) =>
    `chip ${active ? "border-teal-600 bg-teal-600 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`;

  return (
    <div className="space-y-4">
      {/* Status filters double as the legend */}
      <div className="grid gap-3 sm:grid-cols-3">
        {(["new", "working", "done"] as const).map((g) => {
          const Icon = GROUP_ICON[g];
          const active = group === g;
          return (
            <button
              key={g}
              type="button"
              onClick={() => setGroup(active ? "all" : g)}
              aria-pressed={active}
              className={`card flex items-center gap-3 p-4 text-left transition ${active ? "ring-2 ring-teal-500" : "hover:-translate-y-0.5 hover:shadow-pop"}`}
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-xl text-white" style={{ background: COLORS[g] }}>
                <Icon className="h-5 w-5" />
              </span>
              <span>
                <span className="block font-display text-2xl font-extrabold tabular-nums text-slate-900">{markers ? counts[g] : "–"}</span>
                <span className="block text-sm text-slate-500">{GROUP_LABEL[g]}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by type of problem">
        <button type="button" onClick={() => setCategory("all")} className={chip(category === "all")} aria-pressed={category === "all"}>
          All problems
        </button>
        {categories.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setCategory(id)} className={chip(category === id)} aria-pressed={category === id}>
            {label}
          </button>
        ))}
        <span className="ml-auto text-sm text-slate-500">{markers ? `${shown.length} shown` : "Loading…"}</span>
      </div>

      <div className="card relative overflow-hidden p-1.5">
        <div ref={el} className="h-[58vh] min-h-[360px] w-full rounded-xl" role="application" aria-label="Map of reported problems" />
        {markers && markers.length === 0 ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
            <p className="rounded-xl bg-white/95 px-4 py-3 text-center text-sm font-medium text-slate-600 shadow-pop">No problems have been reported yet.</p>
          </div>
        ) : null}
      </div>

      {error ? (
        <div role="alert" className="flex gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="font-medium">{error}</p>
        </div>
      ) : null}

      <p className="flex gap-2 text-xs leading-relaxed text-slate-500">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        Locations are approximate on purpose, to protect people&apos;s privacy. Duplicate and rejected reports are not shown. These are
        reports sent to CivicOS, not an official government record.
      </p>
    </div>
  );
}
