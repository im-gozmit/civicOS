/**
 * The Sudhaar logo (public/sudhaar-logo.webp): the Prayagraj skyline, bridge and road over the wordmark.
 * The wordmark is dark, so on a dark photo (`onDark`) the logo sits on a light badge to stay readable.
 */
export function Logo({ className = "", onDark = false, size = "md" }: { className?: string; onDark?: boolean; size?: "sm" | "md" | "lg" | "xl" }) {
  const height = { sm: "h-10", md: "h-12", lg: "h-20", xl: "h-32" }[size];
  return (
    <span className={`inline-flex items-center ${onDark ? "logo-badge rounded-xl bg-[var(--paper)]/90 px-2.5 py-0.5 shadow-lg backdrop-blur-sm" : ""} ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/sudhaar-logo.webp" alt="Sudhaar" width={1000} height={500} className={`${height} w-auto`} />
    </span>
  );
}
