import { seoPageCopy } from "@/lib/seo-content";
import Link from "next/link";
import { CatalogImage as Image } from "./components/CatalogImage";
import type { Metadata } from "next";
import {
  ArrowRight,
  Scale,
  TrendingUp,
  Truck,
  Clock,
  Sparkles,
} from "@/app/(root)/components/icons";
import { getCategoryShowcase, getGlobalSettings } from "@/app/actions";
import { BenefitsSection } from "./components/BenefitCard";
import { ReviewsSection } from "./components/ReviewsSection";
import { SITE_BRAND, SITE_URL as BASE_URL } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { canonicalPageUrl } from "@/lib/seo-routing";

// Отключаем статический пререндеринг (требуется БД)
export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: `${SITE_BRAND} — скупка радиодеталей и плат в Санкт-Петербурге`,
  description: `${SITE_BRAND}: покупаем радиодетали, платы и приборы в Санкт-Петербурге. Актуальные цены, оценка по фото и оплата при приёмке. Принимаем посылки со всей России.`,
  path: "/",
});

// JSON-LD Schema.org для LocalBusiness (лучше для Google Local)
interface OrganizationSchemaProps {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  workSchedule?: string;
  telegram?: string;
}

// Парсинг расписания работы в формат Schema.org
function parseWorkSchedule(schedule: string): Array<{
  "@type": "OpeningHoursSpecification";
  dayOfWeek: string[];
  opens: string;
  closes: string;
}> | undefined {
  if (!schedule) return undefined;
  
  const specs: Array<{
    "@type": "OpeningHoursSpecification";
    dayOfWeek: string[];
    opens: string;
    closes: string;
  }> = [];
  
  const dayMap: Record<string, string> = {
    "пн": "Monday",
    "вт": "Tuesday", 
    "ср": "Wednesday",
    "чт": "Thursday",
    "пт": "Friday",
    "сб": "Saturday",
    "вс": "Sunday",
  };
  
  const lines = schedule.split("\n").filter(line => line.trim());
  
  for (const line of lines) {
    // Паттерн: "Вт-Пт: с 11:00 до 17:00" или "Сб-Вс: с 10:00 до 17:00"
    const match = line.match(/([а-яА-Я]{2})[-–]?([а-яА-Я]{2})?[:\s]+(?:с\s+)?(\d{1,2}:\d{2})\s*(?:до|-)\s*(\d{1,2}:\d{2})/i);
    
    if (match) {
      const startDay = match[1].toLowerCase();
      const endDay = match[2]?.toLowerCase() || startDay;
      const opens = match[3];
      const closes = match[4];
      
      const days: string[] = [];
      const dayKeys = Object.keys(dayMap);
      let inRange = false;
      
      for (const key of dayKeys) {
        if (key === startDay) inRange = true;
        if (inRange) days.push(dayMap[key]);
        if (key === endDay) break;
      }
      
      if (days.length > 0) {
        specs.push({
          "@type": "OpeningHoursSpecification",
          dayOfWeek: days,
          opens,
          closes,
        });
      }
    }
  }
  
  return specs.length > 0 ? specs : undefined;
}

function OrganizationSchema({ name, phone, email, address, workSchedule, telegram }: OrganizationSchemaProps) {
  const baseUrl = BASE_URL;
  
  const openingHours = workSchedule ? parseWorkSchedule(workSchedule) : undefined;
  
  // Формируем sameAs (ссылки на соцсети)
  const sameAs: string[] = [];
  if (telegram) {
    const cleanTelegram = telegram.replace(/^@/, "").replace(/^https?:\/\/t\.me\//, "");
    sameAs.push(`https://t.me/${cleanTelegram}`);
  }
  
  const schema = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${baseUrl}/#organization`,
    name,
    url: baseUrl,
    logo: `${baseUrl}/logo.svg`,
    image: `${baseUrl}/opengraph-image`,
    description: "Скупка радиодеталей, содержащих драгоценные металлы. Транзисторы, конденсаторы, микросхемы, реле.",
    priceRange: "₽₽",
    currenciesAccepted: "RUB",
    paymentAccepted: "Cash, Card",
    ...(phone && { telephone: phone }),
    ...(email && { email }),
    ...(address && {
      address: {
        "@type": "PostalAddress",
        streetAddress: address,
        addressLocality: "Санкт-Петербург",
        addressCountry: "RU",
      },
    }),
    areaServed: {
      "@type": "City",
      name: "Санкт-Петербург",
    },
    ...(openingHours && { openingHoursSpecification: openingHours }),
    ...(sameAs.length > 0 && { sameAs }),
  };

  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    name,
    alternateName: name === "РадиоКлад" ? ["Радио Клад", "RadioKlad"] : undefined,
    url: canonicalPageUrl("/", baseUrl),
    inLanguage: "ru-RU",
    publisher: { "@id": `${baseUrl}/#organization` },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify([schema, website]).replace(/</g, "\\u003c") }}
    />
  );
}

// Получить суффикс единицы измерения для цены
function getPriceUnitSuffix(unitType: "PIECE" | "GRAM" | "KG"): string {
  switch (unitType) {
    case "GRAM": return "/г.";
    case "KG": return "/кг.";
    default: return "/шт.";
  }
}

// Форматирование цены
function formatPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

// The section order stays unchanged; only presentation is replaced.
function HeroSection() {
  return (
    <section className="rk-hero">
      <picture className="rk-hero-artwork">
        <source media="(max-width: 767px)" srcSet="/images/radioklad-real-parts-mobile-v2.png" width={1536} height={1024} />
        {/* Art direction selects a complete composition for each screen size. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/radioklad-real-parts-desktop-v2.png" alt="" width={1774} height={887} fetchPriority="high" className="rk-hero-image" />
      </picture>
      <div className="container mx-auto px-4 rk-hero-content">
        <p className="rk-eyebrow"><span /> Скупка радиодеталей · Санкт-Петербург</p>
        <h1>{seoPageCopy("/")?.h1}</h1>
        <p className="rk-hero-tagline">В ваших деталях — больше ценности.</p>
        <p className="rk-hero-description">Покупаем радиодетали, платы и приборы.<br />Оценим по актуальным ценам. Честно рассчитаем. Сразу оплатим.</p>
        <div className="rk-hero-buttons">
          <Link href="/catalog" className="rk-button rk-button-primary">Смотреть каталог <ArrowRight className="w-4 h-4" /></Link>
          <Link href="/contacts" className="rk-button rk-button-outline">Связаться с нами</Link>
        </div>
        <Link href="/postal" className="rk-hero-postal"><Truck className="w-4 h-4" /> Принимаем посылки со всей России <ArrowRight className="w-3 h-3" /></Link>
      </div>
    </section>
  );
}

// Catalog Section - 10 cards with most expensive product per category (5 in a row)
async function CatalogSection() {
  const result = await getCategoryShowcase(10);

  if (!result.success || result.data.length === 0) {
    return null;
  }

  const showcaseItems = result.data;

  return (
    <section className="rk-showcase py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="rk-section-heading flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--gray-900)]">
              Каталог радиодеталей
            </h2>
            <p className="text-[var(--gray-600)] mt-2">
              Найдите свои детали и узнайте цену скупки
            </p>
          </div>
          <Link
            href="/catalog"
            className="hidden md:flex items-center gap-2 text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium"
          >
            Все категории
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Grid: 1 column mobile, 3 md, 5 xl */}
        <div className="rk-showcase-grid grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {showcaseItems.map((item) => (
            <Link
              key={item.id}
              href={`/catalog/${item.categorySlug}`}
              className="rk-showcase-card group block bg-white rounded-xl border border-[var(--gray-200)] hover:border-[var(--accent-400)] hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              {/* Product image */}
              <div className="rk-showcase-media relative aspect-square bg-[var(--gray-100)] overflow-hidden">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-contain"
                    sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 20vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-500 text-sm font-medium">Фото пока нет</span>
                  </div>
                )}
                {/* Category label with gradient fade at top */}
                <div className="rk-category-label">
                  <span className="block">
                    {item.categoryName}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="rk-showcase-content p-2 md:p-4">
                {/* Product name */}
                <h3 className="font-semibold text-[var(--gray-800)] group-hover:text-[var(--primary-600)] transition-colors min-h-[2.5rem]">
                  {item.name}
                </h3>

                {/* Description */}
                {item.description && (
                  <p className="text-[15px] leading-snug text-[var(--gray-800)] font-medium mb-5">
                    {item.description}
                  </p>
                )}

                {/* Prices */}
                <div>
                  {/* Цена по запросу */}
                  {item.isPriceOnRequest ? (
                    <div className="flex items-center justify-center px-2 py-2.5 rounded-md bg-slate-100">
                      <span className="text-sm font-medium text-slate-500 italic">
                        Цена по запросу
                      </span>
                    </div>
                  ) : item.hasModifications && item.modifications.length > 0 ? (
                    /* Таблица модификаций */
                    <div className="rk-modifications rounded-lg border border-[var(--gray-200)] overflow-hidden">
                      {/* Заголовок */}
                      <div className="flex items-center bg-[var(--gray-100)] text-[11px] font-bold uppercase tracking-wide text-[var(--gray-500)] border-b border-[var(--gray-200)]">
                        <span className="flex-1 px-2 py-1.5 min-w-0 whitespace-nowrap overflow-hidden">{item.modLabel || 'Модификация'}</span>
                        {!item.isSingleType && item.isNewAvailable && item.isUsedAvailable ? (
                          <>
                            <span className="px-1.5 py-1.5 text-left border-l border-[var(--gray-200)] w-[30%] shrink-0">Новые</span>
                            <span className="px-1.5 py-1.5 text-left border-l border-[var(--gray-200)] w-[30%] shrink-0">Б/У</span>
                          </>
                        ) : (
                          <span className="px-1.5 py-1.5 text-left border-l border-[var(--gray-200)] w-[55%] shrink-0">Цена</span>
                        )}
                      </div>
                      {/* Строки */}
                      {item.modifications.map((mod, idx) => {
                        const showUsed = !item.isSingleType && item.isNewAvailable && item.isUsedAvailable;
                        const singlePrice = item.isSingleType || item.isNewAvailable ? mod.priceNew : mod.priceUsed;
                        const isLast = idx === item.modifications.length - 1;
                        return (
                          <div key={mod.id} className={`flex items-center ${!isLast ? 'border-b border-[var(--gray-200)]' : ''}`}>
                            <span className="flex-1 px-2 py-1.5 text-xs font-bold text-[var(--gray-900)] min-w-0 break-words">
                              {mod.name}
                            </span>
                            {showUsed ? (
                              <>
                                <span className="px-1.5 py-1.5 text-left border-l border-[var(--gray-100)] font-extrabold text-[var(--gray-900)] whitespace-nowrap overflow-hidden text-[11px] w-[30%] shrink-0">
                                  {formatPrice(mod.priceNew)}{getPriceUnitSuffix(item.unitType)}
                                </span>
                                <span className="px-1.5 py-1.5 text-left border-l border-[var(--gray-100)] font-extrabold text-[var(--gray-900)] whitespace-nowrap overflow-hidden text-[11px] w-[30%] shrink-0">
                                  {formatPrice(mod.priceUsed)}{getPriceUnitSuffix(item.unitType)}
                                </span>
                              </>
                            ) : (
                              <span className="px-1.5 py-1.5 text-left border-l border-[var(--gray-100)] font-extrabold text-[var(--gray-900)] whitespace-nowrap text-xs w-[55%] shrink-0">
                                {formatPrice(singlePrice)}{getPriceUnitSuffix(item.unitType)}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {item.priceNew !== null && (
                        <div className="rk-price-row flex items-center justify-between">
                          <span className="text-sm font-medium text-[var(--gray-900)]">
                            {item.isSingleType ? 'Цена' : 'Новые'}
                          </span>
                          <span className="text-sm font-bold text-[var(--gray-900)]">
                            {formatPrice(item.priceNew)}{getPriceUnitSuffix(item.unitType)}
                          </span>
                        </div>
                      )}
                      {item.priceUsed !== null && !item.isSingleType && (
                        <div className="rk-price-row flex items-center justify-between">
                          <span className="text-sm font-medium text-[var(--gray-900)]">Б/У</span>
                          <span className="text-sm font-bold text-[var(--gray-900)]">
                            {formatPrice(item.priceUsed)}{getPriceUnitSuffix(item.unitType)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>

        <Link
          href="/catalog"
          className="md:hidden flex items-center justify-center gap-2 mt-6 text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium"
        >
          Все категории
          <ArrowRight className="w-4 h-4" />
        </Link>

        <div className="flex justify-center mt-10">
          <Link
            href="/catalog"
            className="rk-button rk-button-primary"
          >
            Смотреть каталог
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

// Stats Section (moved from Hero)
function StatsSection() {
  const stats = [
    { value: "10+", label: "Лет опыта", icon: Clock },
    { value: "500+", label: "Позиций в каталоге", icon: TrendingUp },
    { value: "24ч", label: "Быстрая оценка", icon: Scale },
  ];

  return (
    <section className="rk-stats py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-500/20 mb-4">
                <stat.icon className="w-7 h-7 text-amber-400" />
              </div>
              <p className="text-3xl md:text-4xl font-bold text-white mb-2">
                {stat.value}
              </p>
              <p className="text-white/70">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// CTA Section
function CTASection({ phone, phoneHref }: { phone: string; phoneHref: string }) {
  return (
    <section className="rk-cta py-16 md:py-20">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
          Готовы сдать радиодетали?
        </h2>
        <p className="text-white/80 mb-8 max-w-xl mx-auto">
          Свяжитесь с нами для оценки вашей партии. Мы предложим лучшую цену!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/contacts"
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-[var(--accent-500)] hover:bg-[var(--accent-600)] rounded-lg font-semibold text-lg text-white transition-colors"
          >
            Связаться с нами
          </Link>
          <a
            href={phoneHref}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg font-semibold text-lg text-white transition-colors"
          >
            {phone}
          </a>
        </div>
      </div>
    </section>
  );
}

export default async function HomePage() {
  // Получаем контактные данные из БД
  const settingsResult = await getGlobalSettings();
  const settings = settingsResult.success ? settingsResult.data : null;

  const phone = settings?.phoneNumber || "+7 (812) 983-49-76";
  const phoneHref = `tel:${(settings?.phoneNumber || "+78129834976").replace(/[^\d+]/g, "")}`;

  return (
    <>
      {/* JSON-LD Schema.org LocalBusiness */}
      <OrganizationSchema
        name={SITE_BRAND}
        phone={settings?.phoneNumber}
        email={settings?.email}
        address={settings?.address}
        workSchedule={settings?.workSchedule}
        telegram={settings?.telegramUsername}
      />
      <HeroSection />
      <CatalogSection />
      <StatsSection />
      <BenefitsSection />
      <CTASection phone={phone} phoneHref={phoneHref} />
      <ReviewsSection />
    </>
  );
}
