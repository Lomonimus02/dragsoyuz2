import type { Metadata } from "next";
import { Header, Footer, TopAlert, CartIndicator } from "./components";
import { getGlobalSettings, isAuthenticated } from "@/app/actions";
import type { HeaderContactInfo } from "./components/Header";
import type { FooterContactInfo } from "./components/Footer";
import { JivoWidget } from "./components/JivoWidget";
import { PromoPopup } from "./components/PromoPopup";
import { IosChromeRestoreReload } from "./components/IosChromeRestoreReload";
import { SiteContactsProvider } from "./components/SiteContactsProvider";
import { YearDiscountsProvider } from "./components/YearDiscountsProvider";
import { buildSellContactInfo, formatPhoneHref, formatTelegramHref, SITE_BRAND } from "@/lib/site";
import { DEFAULT_YEAR_PERIOD_DISCOUNTS } from "@/lib/year-discount";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: {
    default: `${SITE_BRAND} — Скупка радиодеталей в СПб по высоким ценам`,
    template: `%s | ${SITE_BRAND}`,
  },
  description:
    "Профессиональная скупка радиодеталей, содержащих драгоценные металлы. Транзисторы, конденсаторы, микросхемы, реле. Честные цены, быстрая оценка, оплата на месте.",
  keywords: [
    "скупка радиодеталей",
    "транзисторы",
    "конденсаторы",
    "микросхемы",
    "драгметаллы",
    "золото",
    "серебро",
    "палладий",
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Получаем контактные данные из БД
  const settingsResult = await getGlobalSettings();
  const settings = settingsResult.success ? settingsResult.data : null;
  const sellContactInfo = buildSellContactInfo(settings);
  const isAdmin = await isAuthenticated();

  // Формируем данные для Header
  const headerContactInfo: HeaderContactInfo | undefined = settings ? {
    phoneNumber: settings.phoneNumber || "+7 (812) 983-49-76",
    phoneHref: formatPhoneHref(settings.phoneNumber || "+78129834976"),
    telegramHref: formatTelegramHref(settings.telegramUsername || "dragsoyuz"),
    vkHref: settings.vkLink || "https://vk.com/dragsoyuz",
    workSchedule: settings.workSchedule?.split("\n")[0] || "Ежедневно с 10:00 до 20:00",
  } : undefined;

  // Формируем данные для Footer  
  const footerContactInfo: FooterContactInfo | undefined = settings ? {
    phone: settings.phoneNumber || "+7 (812) 983-49-76",
    phoneRaw: (settings.phoneNumber || "+78129834976").replace(/[^\d+]/g, ""),
    email: settings.email || "info@dragsoyuz.ru",
    telegram: (settings.telegramUsername || "dragsoyuz").replace(/^@/, "").replace(/^https?:\/\/t\.me\//, ""),
    vkLink: settings.vkLink || "https://vk.com/dragsoyuz",
    address: settings.address || "г. Санкт-Петербург",
    workSchedule: settings.workSchedule 
      ? settings.workSchedule.split("\n").filter(line => line.trim())
      : ["Пн-Пт: 10:00 - 18:00", "Сб: по записи", "Вс: выходной"],
  } : undefined;

  return (
    <YearDiscountsProvider
      value={settings?.yearPeriodDiscounts ?? DEFAULT_YEAR_PERIOD_DISCOUNTS}
      isAdmin={isAdmin}
    >
    <SiteContactsProvider contacts={sellContactInfo}>
      <div className="storefront-shell h-full flex flex-col bg-[var(--background)] overflow-y-auto overflow-x-hidden overscroll-none print:h-auto print:overflow-visible print:bg-white" style={{ WebkitOverflowScrolling: 'touch' }}>
      <div className="sticky top-0 z-50 bg-[var(--gray-700)] shrink-0 print:hidden" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <TopAlert
          show={settings?.showArrivalNotice ?? true}
          text={settings?.arrivalNoticeText}
        />
        <Header contactInfo={headerContactInfo} />
      </div>
      <main className="flex-1">{children}</main>
      <div className="print:hidden">
        <Footer contactInfo={footerContactInfo} />
      </div>
      <div className="print:hidden">
        <CartIndicator />
        <PromoPopup
          enabled={settings?.promoEnabled ?? false}
          text={settings?.promoText ?? ""}
          terms={settings?.promoTerms ?? ""}
          updatedAt={settings ? settings.promoUpdatedAt.toISOString() : ""}
          buttonUrl={settings?.promoButtonUrl ?? ""}
          buttonLabel={settings?.promoButtonLabel ?? ""}
          buttonCaption={settings?.promoButtonCaption ?? ""}
        />
        <JivoWidget />
        <IosChromeRestoreReload />
      </div>
    </div>
    </SiteContactsProvider>
    </YearDiscountsProvider>
  );
}
