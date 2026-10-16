"use client";

import { createContext, useContext } from "react";
import type { SellModalContactInfo } from "./SellModal";

const SiteContactsContext = createContext<SellModalContactInfo | null>(null);

export function SiteContactsProvider({
  contacts,
  children,
}: {
  contacts: SellModalContactInfo;
  children: React.ReactNode;
}) {
  return (
    <SiteContactsContext.Provider value={contacts}>
      {children}
    </SiteContactsContext.Provider>
  );
}

export function useSiteContacts(): SellModalContactInfo | null {
  return useContext(SiteContactsContext);
}
