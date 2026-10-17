import { TicketLookup } from "@/components/public/TicketLookup";

export const metadata = { title: "Track a complaint — CivicOS" };

export default function TrackIndexPage() {
  return (
    <main className="mx-auto w-full max-w-xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-semibold">Track a complaint</h1>
      <p className="text-sm text-zinc-600">Enter your complaint number to see its current status.</p>
      <TicketLookup />
    </main>
  );
}
