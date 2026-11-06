"use client";

import { createContext, useContext, type ReactNode } from "react";

type PriceDate = { iso: string; label: string };
const DateContext = createContext<PriceDate | null>(null);
const dateFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

export function PriceListDateProvider({ value, children }: { value: PriceDate | null; children: ReactNode }) {
  return <DateContext.Provider value={value}>{children}</DateContext.Provider>;
}

export function PriceListDate({ prominent = false }: { prominent?: boolean }) {
  const date = useContext(DateContext);
  if (!date) return null;
  const { iso, label } = date;
  return (
    <div className={prominent ? "rk-price-list-date rk-price-list-date--section" : "rk-price-list-date"}>
      {label && <>{label} </>}<time dateTime={iso}>{dateFormat.format(new Date(iso + "T00:00:00Z"))}</time>
    </div>
  );
}
