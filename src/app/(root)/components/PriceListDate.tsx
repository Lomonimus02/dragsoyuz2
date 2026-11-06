"use client";

import { createContext, useContext, type ReactNode } from "react";

type PriceDate = { iso: string; label: string };
const DateContext = createContext<PriceDate | null>(null);
const dayMonthFormat = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

export function PriceListDateProvider({ value, children }: { value: PriceDate | null; children: ReactNode }) {
  return <DateContext.Provider value={value}>{children}</DateContext.Provider>;
}

export function PriceListDate({ prominent = false }: { prominent?: boolean }) {
  const date = useContext(DateContext);
  if (!date) return null;
  const { iso, label } = date;
  const day = new Date(iso + "T00:00:00Z");
  return (
    <div className={prominent ? "rk-price-list-date rk-price-list-date--section" : "rk-price-list-date"}>
      {label && <span>{label} </span>}
      <time dateTime={iso}>{dayMonthFormat.format(day)} {day.getUTCFullYear()} года</time>
    </div>
  );
}
