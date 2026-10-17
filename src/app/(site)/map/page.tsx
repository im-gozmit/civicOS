import Link from "next/link";
import { Camera } from "lucide-react";
import { IssueMap } from "@/components/public/IssueMap";

export const metadata = { title: "Problems nearby" };

export default function MapPage() {
  return (
    <div className="bg-hero">
      <main className="container-page space-y-6 py-8 sm:py-12">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Live map</p>
            <h1 className="mt-1 text-3xl font-extrabold text-slate-900 sm:text-4xl">Problems reported nearby</h1>
            <p className="mt-2 max-w-xl text-slate-600">See what has been reported around Prayagraj and whether it is being handled.</p>
          </div>
          <Link href="/report" className="btn btn-primary">
            <Camera className="h-4 w-4" /> Report a problem
          </Link>
        </header>
        <IssueMap />
      </main>
    </div>
  );
}
