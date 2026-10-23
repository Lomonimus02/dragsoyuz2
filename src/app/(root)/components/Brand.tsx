import { SITE_BRAND } from "@/lib/site";

export function Brand() {
  return (
    <span className="rk-brand">
      <svg className="rk-brand-mark" viewBox="0 0 44 44" fill="none" aria-hidden="true">
        <rect width="44" height="44" rx="12" fill="currentColor" />
        <path d="M13 31V13h9a6 6 0 0 1 0 12h-9m8-1 10 7M30 12l-5 5" stroke="#f7f5ed" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="32" cy="11" r="3" fill="#c88c63" />
      </svg>
      <strong>{SITE_BRAND}</strong>
    </span>
  );
}
