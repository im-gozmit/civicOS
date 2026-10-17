export function LogoMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} role="img" aria-label="CivicOS logo">
      <defs>
        <linearGradient id="civicos-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f15a14" />
          <stop offset="1" stopColor="#cf3d0f" />
        </linearGradient>
      </defs>
      <rect width="40" height="40" rx="11" fill="url(#civicos-g)" />
      <path
        d="M20 8.5c-4.7 0-8.5 3.7-8.5 8.3 0 5.9 6.7 12.2 7.6 13a1.3 1.3 0 0 0 1.8 0c.9-.8 7.6-7.1 7.6-13 0-4.6-3.8-8.3-8.5-8.3Z"
        fill="#fff"
      />
      <path d="m16.4 17.3 2.6 2.7 4.7-5" fill="none" stroke="#cf3d0f" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark />
      <span className="font-display text-xl font-extrabold tracking-tight text-slate-900">
        Civic<span className="text-teal-600">OS</span>
      </span>
    </span>
  );
}
