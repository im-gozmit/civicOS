import Link from "next/link";
import { Search } from "lucide-react";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <main className="container-page py-20 text-center">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        <Search className="h-7 w-7" />
      </span>
      <h1 className="mt-6 text-3xl font-extrabold text-slate-900">We could not find that page</h1>
      <p className="mx-auto mt-3 max-w-md text-slate-600">
        The link may be incomplete or mistyped. If you are looking for a complaint, check the number or open the personal link you received.
      </p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <Link href="/track" className="btn btn-primary">
          Track a complaint
        </Link>
        <Link href="/" className="btn btn-secondary">
          Go to the home page
        </Link>
      </div>
    </main>
  );
}
