"use client";
import { createContext, useContext, type ReactNode } from "react";
const DateContext = createContext<string | null>(null);
const dateFormat = new Intl.DateTimeFormat("ru-RU", {day:"numeric",month:"long",year:"numeric",timeZone:"UTC"});
export function PriceListDateProvider({value,children}:{value:string|null;children:ReactNode}) {
  return <DateContext.Provider value={value}>{children}</DateContext.Provider>;
}
export function PriceListDate() {
  const iso = useContext(DateContext);
  if (!iso) return null;
  return <div className="rk-price-list-date">Цены на <time dateTime={iso}>{dateFormat.format(new Date(iso+"T00:00:00Z"))}</time></div>;
}
