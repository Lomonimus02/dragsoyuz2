import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import {
  ArrowRight,
  Scale,
  TrendingUp,
  Truck,
  Clock,
  Sparkles,
} from "lucide-react";
import { getCategoryShowcase, getGlobalSettings } from "@/app/actions";
import { BenefitsSection } from "./components/BenefitCard";
import { ReviewsSection } from "./components/ReviewsSection";
import { SITE_BRAND, SITE_URL as BASE_URL } from "@/lib/site";

// Отключаем статический пререндеринг (требуется БД)
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: `Покупка радиодеталей и плат в СПБ | Скупка по выгодным ценам | Любые объемы | ${SITE_BRAND}` },
  description: `Выгодная скупка радиодеталей, приборов и лома драгметаллов в Санкт-Петербурге. Высокие цены, любые объемы, честное взвешивание, оплата сразу. Работаем с физическими и юридическими лицами — компания ${SITE_BRAND} СПб`,
  alternates: {
    canonical: BASE_URL,
  },
  openGraph: {
    title: `Покупка радиодеталей и плат в СПБ | Скупка по выгодным ценам | ${SITE_BRAND}`,
    description: "Выгодная скупка радиодеталей, приборов и лома драгметаллов в Санкт-Петербурге. Высокие цены, любые объемы, честное взвешивание, оплата сразу.",
    type: "website",
    url: BASE_URL,
  },
};

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
    "@id": baseUrl,
    name,
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
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

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
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

// Hero Section
function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
      {/* Premium gold accent gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-transparent to-amber-500/10" />
      
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='0.8'%3E%3Cpath d='M50 50m-40 0a40 40 0 1 0 80 0a40 40 0 1 0-80 0' stroke-width='0.5' stroke='%23fbbf24'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />
      </div>

      {/* Decorative elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 py-20 md:py-28 lg:py-36 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-300 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Надёжный партнёр с 2014 года
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight">
            <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent">
              {SITE_BRAND}
            </span>
          </h1>
          <h2 className="text-xl md:text-2xl lg:text-3xl text-white/90 mb-8 max-w-2xl mx-auto font-medium">
            Скупка радиодеталей в СПб по высоким ценам
          </h2>
          <p className="text-lg text-white/60 mb-10 max-w-xl mx-auto">
            Честная оценка, оплата сразу, работаем с физическими и юридическими лицами
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/catalog"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 rounded-xl font-semibold text-lg transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40"
            >
              Смотреть каталог
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contacts"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl font-semibold text-lg transition-all backdrop-blur-sm"
            >
              Связаться с нами
            </Link>
          </div>
          <div className="flex justify-center mt-4 sm:hidden">
            <Link
              href="/postal"
              className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 bg-white/5 hover:bg-white/15 border border-white/15 rounded-xl font-semibold text-lg text-white/80 hover:text-white transition-all backdrop-blur-sm"
            >
              <Truck className="w-4 h-4" />
              Почтовые отправления
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg
          viewBox="0 0 1440 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto"
        >
          <path
            d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z"
            fill="var(--background)"
          />
        </svg>
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
    <section className="py-16 md:py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--gray-900)]">
              Каталог
            </h2>
            <p className="text-[var(--gray-600)] mt-2">
              Топовые позиции из каждой категории
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
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {showcaseItems.map((item) => (
            <Link
              key={item.id}
              href={`/catalog/${item.categorySlug}`}
              className="group block bg-white rounded-xl border border-[var(--gray-200)] hover:border-[var(--accent-400)] hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              {/* Product image */}
              <div className="relative aspect-[3/2] md:aspect-square bg-[var(--gray-100)] overflow-hidden">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 33vw, 20vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <span className="text-gray-400 text-sm font-medium">Загрузка фото</span>
                  </div>
                )}
                {/* Category label with gradient fade at top */}
                <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/70 via-black/40 to-transparent pt-3 pb-10 px-3">
                  <span className="block text-white text-lg font-bold drop-shadow-md">
                    {item.categoryName}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-2 md:p-4">
                {/* Product name */}
                <h3 className="font-semibold text-[var(--gray-800)] group-hover:text-[var(--primary-600)] transition-colors line-clamp-2 min-h-[2.5rem]">
                  {item.name}
                </h3>

                {/* Description */}
                {item.description && (
                  <p className="text-[15px] leading-snug text-[var(--gray-800)] font-medium mb-5 line-clamp-2">
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
                    <div className="rounded-lg border border-[var(--gray-200)] overflow-hidden">
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
                        <div className="flex items-center justify-between px-2 py-1 bg-[var(--gray-100)] border border-[var(--gray-900)] rounded-md">
                          <span className="text-sm font-medium text-[var(--gray-900)]">
                            {item.isSingleType ? 'Цена' : 'Новые'}
                          </span>
                          <span className="text-sm font-bold text-[var(--gray-900)]">
                            {formatPrice(item.priceNew)}{getPriceUnitSuffix(item.unitType)}
                          </span>
                        </div>
                      )}
                      {item.priceUsed !== null && !item.isSingleType && (
                        <div className="flex items-center justify-between px-2 py-1 bg-[var(--gray-100)] border border-[var(--gray-900)] rounded-md">
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
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-semibold text-lg rounded-xl shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all"
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
    <section className="py-12 md:py-16 bg-gradient-to-r from-[var(--primary-800)] to-[var(--primary-900)]">
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
    <section className="py-16 md:py-20 bg-gradient-to-r from-[var(--primary-800)] to-[var(--primary-900)]">
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
