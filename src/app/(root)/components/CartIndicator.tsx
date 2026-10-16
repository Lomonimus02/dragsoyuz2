"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Calculator } from "lucide-react";
import { useCartStore } from "@/store";
import { useEffect } from "react";

export function CartIndicator() {
  const lineCount = useCartStore((state) => state.items.length);
  const hasHydrated = useCartStore((state) => state.hasHydrated);
  const pathname = usePathname();

  useEffect(() => {
    if (useCartStore.persist.hasHydrated()) {
      useCartStore.setState({ hasHydrated: true });
      return;
    }

    void useCartStore.persist.rehydrate();
  }, []);

  if (!hasHydrated) {
    return null;
  }

  const visible = lineCount > 0 && pathname !== "/cart";
  const badgeText = lineCount > 99 ? "99+" : String(lineCount);

  return (
    <Link
      href="/cart"
      className={`fixed z-[60] left-4 bottom-6 md:left-6 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-500)] text-white shadow-lg shadow-black/25 hover:bg-[var(--accent-600)] transition-[opacity,transform] duration-200 print:hidden ${
        visible
          ? "opacity-100 scale-100"
          : "pointer-events-none opacity-0 scale-90"
      }`}
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      aria-label={`Опись, ${lineCount} позиций`}
      title="Опись"
    >
      <Calculator className="h-6 w-6" />
      <span className="absolute -top-1 -right-1 min-w-6 h-6 px-1 flex items-center justify-center bg-[var(--primary-800)] text-white text-xs font-bold rounded-full border-2 border-white tabular-nums">
        {badgeText}
      </span>
    </Link>
  );
}
