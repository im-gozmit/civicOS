import Link from "next/link";

export default function Home() {
  const bot = (process.env.WHATSAPP_BOT_NUMBER || "").replace(/\D/g, "");
  return (
    <main className="mx-auto w-full max-w-xl space-y-8 px-4 py-12">
      <header className="space-y-2">
        <p className="font-mono text-sm text-teal-800">CivicOS · Prayagraj</p>
        <h1 className="text-4xl font-semibold">Report. Track. Resolve.</h1>
        <p className="text-zinc-600">
          See a pothole, garbage pile, blocked drain or broken street light? Send a photo. We will log it, suggest the
          right team, and keep you updated.
        </p>
      </header>

      <div className="space-y-3">
        <Link href="/report" className="block rounded bg-teal-700 px-4 py-4 text-center text-lg font-medium text-white">
          Report a problem
        </Link>
        <Link href="/track" className="block rounded border border-teal-700 px-4 py-4 text-center text-lg font-medium text-teal-800">
          Track a complaint
        </Link>
        {bot ? (
          <a
            href={`https://wa.me/${bot}?text=${encodeURIComponent("Hi")}`}
            className="block rounded border border-zinc-300 px-4 py-4 text-center text-lg font-medium text-zinc-700"
          >
            Report on WhatsApp
          </a>
        ) : null}
      </div>

      <section className="space-y-2 text-sm text-zinc-600">
        <h2 className="font-semibold text-zinc-800">How it works</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Send a photo and the location of the problem, on WhatsApp or this website.</li>
          <li>AI reads the photo and suggests which team should handle it.</li>
          <li>Staff check the suggestion before anything is promised to you.</li>
          <li>You get a message each time the status changes.</li>
        </ol>
        <p className="text-xs text-zinc-500">
          CivicOS is a demo service. The teams shown are demo queues, not official government departments.
        </p>
      </section>
    </main>
  );
}
