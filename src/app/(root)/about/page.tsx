import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Sparkles,
  Scale,
  Banknote,
  Shield,
  Clock,
  ArrowRight,
} from "lucide-react";
import { getGlobalSettings } from "@/app/actions";
import { SITE_BRAND, SITE_URL as BASE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: `О компании по скупке радиодеталей в Санкт-Петербурге | ${SITE_BRAND}` },
  description:
    `${SITE_BRAND} — профессиональная скупка радиодеталей с драгоценными металлами в Санкт-Петербурге. Честное взвешивание, оплата сразу, работаем с физическими и юридическими лицами.`,
  alternates: {
    canonical: `${BASE_URL}/about`,
  },
};

const advantages = [
  {
    icon: Scale,
    title: "Точная оценка",
    description: "Прозрачное взвешивание при клиенте.",
  },
  {
    icon: Banknote,
    title: "Выплаты сразу",
    description: "Наличный и безналичный расчёт — вы получаете деньги в день обращения.",
  },
  {
    icon: Shield,
    title: "Официально",
    description: "Работаем с физическими и юридическими лицами.",
  },
  {
    icon: Clock,
    title: "Экономим время",
    description: "Быстрая приёмка и оценка партии — цените своё время, мы ценим ваше.",
  },
];

export default async function AboutPage() {
  const settingsResult = await getGlobalSettings();
  const aboutText = settingsResult.success ? settingsResult.data.aboutText : "";
  const aboutPhotoUrl = settingsResult.success
    ? settingsResult.data.aboutPhotoUrl
    : "";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* ===== 1. HERO СЕКЦИЯ ===== */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Паттерн с кружочками */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23fbbf24' fill-opacity='0.8'%3E%3Cpath d='M50 50m-40 0a40 40 0 1 0 80 0a40 40 0 1 0-80 0' stroke-width='0.5' stroke='%23fbbf24'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            }}
          />
        </div>

        {/* Декоративные размытые элементы */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-10 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5" />

        <div className="relative z-10">
          {/* Хлебные крошки */}
          <div className="border-b border-slate-700/50">
            <div className="container mx-auto px-4 py-3">
              <nav className="flex items-center gap-2 text-sm text-slate-400">
                <Link href="/" className="hover:text-amber-400 transition-colors">
                  Главная
                </Link>
                <ChevronRight className="w-4 h-4" />
                <span className="text-white font-medium">О компании</span>
              </nav>
            </div>
          </div>

          {/* Заголовок Hero */}
          <div className="container mx-auto px-4 py-16 md:py-28 lg:py-32 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 mb-6 bg-amber-500/20 border border-amber-500/30 rounded-full text-amber-300 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              Надёжный партнёр
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent">
              О нашей компании
            </h1>
            <p className="mt-4 text-lg text-slate-400 max-w-2xl mx-auto">
              Профессиональная скупка радиодеталей, содержащих драгоценные
              металлы. Честно, быстро, выгодно.
            </p>
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
              className="fill-slate-950"
            />
          </svg>
        </div>
      </section>

      {/* ===== 2. СЕКЦИЯ КОНТЕНТА (Split Layout) ===== */}
      <section className="bg-slate-950">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className={`grid grid-cols-1 ${aboutPhotoUrl ? 'lg:grid-cols-2' : ''} gap-12 items-start`}>
            {/* Левая колонка — Текст */}
            <div>
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-white">
                Кто мы такие
              </h2>
              <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full mb-8" />
              {aboutText ? (
                <p className="text-gray-300 text-lg leading-relaxed whitespace-pre-wrap">
                  {aboutText}
                </p>
              ) : (
                <p className="text-slate-500 text-lg italic">
                  Информация о компании заполняется...
                </p>
              )}
            </div>

            {/* Правая колонка — Фото (только если установлено) */}
            {aboutPhotoUrl && (
              <div className="relative">
                <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl shadow-amber-500/10 ring-1 ring-white/10">
                  <Image
                    src={aboutPhotoUrl}
                    alt="О нашей компании"
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                </div>

                {/* Декоративный элемент за фото */}
                <div className="absolute -z-10 -bottom-4 -right-4 w-full h-full rounded-2xl border border-amber-500/20" />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===== 3. БЛОК ПРЕИМУЩЕСТВ ===== */}
      <section className="bg-slate-950">
        <div className="container mx-auto px-4 pb-16 md:pb-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Почему выбирают нас
            </h2>
            <div className="w-16 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full mx-auto" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {advantages.map((item) => (
              <div
                key={item.title}
                className="group bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/[0.08] hover:border-amber-500/30 transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-amber-500/20 flex items-center justify-center mb-4 group-hover:bg-amber-500/30 transition-colors">
                  <item.icon className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== 4. CTA СЕКЦИЯ ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-600/20 via-amber-500/10 to-amber-600/20" />
        <div className="absolute inset-0 bg-slate-900/80" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

        <div className="relative z-10 container mx-auto px-4 py-16 md:py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Готовы выгодно сдать радиодетали?
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
            Свяжитесь с нами или ознакомьтесь с каталогом принимаемых
            радиодеталей. Мы всегда на связи.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 transition-all duration-300"
            >
              Перейти в каталог
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/contacts"
              className="inline-flex items-center gap-2 px-8 py-3.5 border border-white/20 hover:border-white/40 hover:bg-white/5 text-white font-semibold rounded-xl transition-all duration-300"
            >
              Связаться с нами
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
