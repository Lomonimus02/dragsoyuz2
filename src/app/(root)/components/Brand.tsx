import { SITE_BRAND, SITE_THEME } from "@/lib/site";
import { brandIconPath } from "@/lib/brand-mark";

export function Brand() {
  return (
    <span className="rk-brand">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={brandIconPath(SITE_THEME)} alt="" width={44} height={44} className="rk-brand-mark" />
      <strong>{SITE_BRAND}</strong>
    </span>
  );
}
