import Link from "next/link";
import { IssueMap } from "@/components/public/IssueMap";

export const metadata = { title: "Issue map — CivicOS" };

export default function MapPage() {
  return (
    <main className="mx-auto w-full max-w-4xl space-y-4 px-4 py-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Reported problems nearby</h1>
        <Link href="/report" className="rounded bg-teal-700 px-3 py-2 text-sm font-medium text-white">
          Report a problem
        </Link>
      </header>
      <IssueMap />
    </main>
  );
}
