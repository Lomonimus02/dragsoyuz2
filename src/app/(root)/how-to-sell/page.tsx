import type { Metadata } from "next";
import { InfoBreadcrumb } from "../components/InfoBreadcrumb";
import { HowItWorks } from "../components";
import { SITE_BRAND } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: `Как сдать радиодетали: 4 простых шага | ${SITE_BRAND}`,
  description:
    `Пошаговая инструкция: как сдать радиодетали в ${SITE_BRAND}. Свяжитесь с нами, приезжайте в офис, получите оценку по ценам с сайта и оплату наличными без задержек.`,
  path: "/how-to-sell",
});

export default function HowToSellPage() {
  return (
    <div className="rk-info-page rk-how-v2">
      <div className="container mx-auto">
        <InfoBreadcrumb current="Как сдать" />
      </div>

      <HowItWorks variant="page" />
    </div>
  );
}
