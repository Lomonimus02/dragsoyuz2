"use client";

import { createContext, useContext } from "react";
import {
  DEFAULT_YEAR_PERIOD_DISCOUNTS,
  type YearPeriodDiscounts,
} from "@/lib/year-discount";

const YearDiscountsContext = createContext<YearPeriodDiscounts>(
  DEFAULT_YEAR_PERIOD_DISCOUNTS,
);

const AdminSessionContext = createContext(false);

export function YearDiscountsProvider({
  value,
  isAdmin = false,
  children,
}: {
  value: YearPeriodDiscounts;
  isAdmin?: boolean;
  children: React.ReactNode;
}) {
  return (
    <YearDiscountsContext.Provider value={value}>
      <AdminSessionContext.Provider value={isAdmin}>
        {children}
      </AdminSessionContext.Provider>
    </YearDiscountsContext.Provider>
  );
}

export function useYearPeriodDiscounts(): YearPeriodDiscounts {
  return useContext(YearDiscountsContext);
}

export function useIsAdmin(): boolean {
  return useContext(AdminSessionContext);
}
