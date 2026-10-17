import { Construction, Droplets, Lightbulb, MapPin, Trash2, Waves } from "lucide-react";
import type { Category } from "@/lib/types";

const ICON: Record<Category, typeof MapPin> = {
  ROAD_DAMAGE: Construction,
  GARBAGE: Trash2,
  DRAINAGE: Waves,
  WATER_SUPPLY: Droplets,
  STREET_LIGHT: Lightbulb,
  OTHER: MapPin,
};

const TONE: Record<Category, string> = {
  ROAD_DAMAGE: "bg-orange-50 text-orange-600",
  GARBAGE: "bg-lime-50 text-lime-700",
  DRAINAGE: "bg-cyan-50 text-cyan-700",
  WATER_SUPPLY: "bg-sky-50 text-sky-600",
  STREET_LIGHT: "bg-amber-50 text-amber-600",
  OTHER: "bg-slate-100 text-slate-600",
};

export function CategoryIcon({ category, className = "h-10 w-10" }: { category: Category; className?: string }) {
  const Icon = ICON[category];
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-xl ${TONE[category]} ${className}`}>
      <Icon className="h-[55%] w-[55%]" strokeWidth={2} />
    </span>
  );
}
