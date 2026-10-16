import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { HowItWorks } from "../components";
import { SITE_BRAND, SITE_URL as BASE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: `Как сдать радиодетали: 4 простых шага | ${SITE_BRAND}` },
  description:
    `Пошаговая инструкция: как сдать радиодетали в ${SITE_BRAND}. Свяжитесь с нами, приезжайте в офис, получите оценку по ценам с сайта и оплату наличными без задержек.`,
  alternates: {
    canonical: `${BASE_URL}/how-to-sell`,
  },
};

export default function HowToSellPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-slate-400">
            <Link href="/" className="hover:text-amber-400 transition-colors">
              Главная
            </Link>
            <ChevronRight className="w-4 h-4 shrink-0" />
            <span className="text-white font-medium">Как сдать</span>
          </nav>
        </div>
      </div>

      <HowItWorks variant="page" />
    </div>
  );
}
