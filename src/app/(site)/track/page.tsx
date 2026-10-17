import { TicketLookup } from "@/components/public/TicketLookup";

export const metadata = { title: "Track a complaint" };

export default function TrackIndexPage() {
  return (
    <div className="bg-hero">
      <main className="container-page py-10 sm:py-16">
        <div className="mx-auto max-w-xl">
          <p className="eyebrow">Track</p>
          <h1 className="mt-1 text-3xl font-extrabold text-slate-900 sm:text-4xl">Where is my complaint?</h1>
          <p className="mt-3 text-slate-600">Enter your complaint number to see its current status.</p>
          <div className="mt-8">
            <TicketLookup />
          </div>
        </div>
      </main>
    </div>
  );
}
