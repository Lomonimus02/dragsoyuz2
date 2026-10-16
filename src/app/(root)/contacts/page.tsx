import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  ChevronRight,
} from "lucide-react";
import { getGlobalSettings } from "@/app/actions";
import { SITE_BRAND, SITE_URL as BASE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: `Контакты пункта скупки радиодеталей в СПб | ${SITE_BRAND}` },
  description:
    `Свяжитесь с нами для оценки и скупки радиодеталей в Санкт-Петербурге. Телефон, Telegram, ВКонтакте, адрес пункта приёма. Компания ${SITE_BRAND}.`,
  alternates: {
    canonical: `${BASE_URL}/contacts`,
  },
};

// Дефолтные контактные данные
const DEFAULT_CONTACTS = {
  phone: "+7 (812) 983-49-76",
  phoneRaw: "+78129834976",
  email: "info@dragsoyuz.ru",
  telegram: "@dragsoyuz",
  address: "г. Санкт-Петербург",
  workSchedule: ["Пн-Пт: 10:00 - 18:00", "Сб: по записи", "Вс: выходной"],
};

export default async function ContactsPage() {
  // Получаем данные из БД
  const settingsResult = await getGlobalSettings();
  const settings = settingsResult.success ? settingsResult.data : null;

  // Формируем контактные данные (с фолбеком на дефолты)
  const CONTACTS = {
    phone: settings?.phoneNumber || DEFAULT_CONTACTS.phone,
    phoneRaw: (settings?.phoneNumber || DEFAULT_CONTACTS.phoneRaw).replace(/[^\d+]/g, ""),
    email: settings?.email || DEFAULT_CONTACTS.email,
    telegram: settings?.telegramUsername 
      ? (settings.telegramUsername.startsWith("@") ? settings.telegramUsername : `@${settings.telegramUsername}`)
      : DEFAULT_CONTACTS.telegram,
    telegramUsername: (settings?.telegramUsername || "dragsoyuz").replace(/^@/, "").replace(/^https?:\/\/t\.me\//, ""),
    address: settings?.address || DEFAULT_CONTACTS.address,
    workSchedule: settings?.workSchedule
      ? settings.workSchedule.split("\n").filter(line => line.trim())
      : DEFAULT_CONTACTS.workSchedule,
    storePhotoUrls: settings?.storePhotoUrls ?? [],
    vkLink: settings?.vkLink || "https://vk.com/dragsoyuz",
  };
  return (
    <div className="min-h-screen bg-[var(--gray-50)]">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-[var(--gray-200)]">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-[var(--gray-500)]">
            <Link href="/" className="hover:text-[var(--primary-600)]">
              Главная
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[var(--gray-900)] font-medium">Контакты</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--gray-900)] mb-4">
            Свяжитесь с нами
          </h1>
          <p className="text-lg text-[var(--gray-600)] max-w-2xl mx-auto">
            Мы всегда рады помочь с оценкой ваших радиодеталей. Выберите удобный
            способ связи.
          </p>
        </div>

        {/* Store Photos */}
        {CONTACTS.storePhotoUrls.length > 0 && (
          <div className="mb-10 md:mb-14">
            <div className={`grid gap-4 max-w-4xl mx-auto ${
              CONTACTS.storePhotoUrls.length === 1 
                ? "grid-cols-1 max-w-3xl" 
                : CONTACTS.storePhotoUrls.length === 2 
                  ? "grid-cols-1 md:grid-cols-2" 
                  : "grid-cols-1 md:grid-cols-3"
            }`}>
              {CONTACTS.storePhotoUrls.map((url, index) => (
                <div key={url} className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden shadow-lg">
                  <Image
                    src={url}
                    alt={`Фото магазина ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes={CONTACTS.storePhotoUrls.length === 1 
                      ? "(max-width: 768px) 100vw, 768px" 
                      : "(max-width: 768px) 100vw, 400px"}
                    priority={index === 0}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Contact Cards */}
          <div className="space-y-4">
            {/* Phone */}
            <a
              href={`tel:${CONTACTS.phoneRaw}`}
              className="flex items-center gap-4 p-6 bg-white rounded-xl border border-[var(--gray-200)] hover:border-[var(--primary-400)] hover:shadow-md transition-all"
            >
              <div className="w-14 h-14 bg-[var(--primary-100)] rounded-full flex items-center justify-center shrink-0">
                <Phone className="w-7 h-7 text-[var(--primary-600)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--gray-500)] mb-1">Телефон</p>
                <p className="text-xl font-semibold text-[var(--gray-900)]">
                  {CONTACTS.phone}
                </p>
              </div>
            </a>

            {/* ВКонтакте */}
            <a
              href={CONTACTS.vkLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-6 bg-white rounded-xl border border-[var(--gray-200)] hover:border-blue-400 hover:shadow-md transition-all"
            >
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <svg className="w-7 h-7 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.27-1.422 2.18-3.61 2.18-3.61.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/>
                </svg>
              </div>
              <div>
                <p className="text-sm text-[var(--gray-500)] mb-1">ВКонтакте</p>
                <p className="text-xl font-semibold text-[var(--gray-900)]">
                  Написать в VK
                </p>
              </div>
            </a>

            {/* Telegram */}
            <a
              href={`https://t.me/${CONTACTS.telegramUsername}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-6 bg-white rounded-xl border border-[var(--gray-200)] hover:border-blue-400 hover:shadow-md transition-all"
            >
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <Send className="w-7 h-7 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-[var(--gray-500)] mb-1">Telegram</p>
                <p className="text-xl font-semibold text-[var(--gray-900)]">
                  {CONTACTS.telegram}
                </p>
              </div>
            </a>

            {/* Email */}
            <a
              href={`mailto:${CONTACTS.email}`}
              className="flex items-center gap-4 p-6 bg-white rounded-xl border border-[var(--gray-200)] hover:border-[var(--accent-400)] hover:shadow-md transition-all"
            >
              <div className="w-14 h-14 bg-[var(--accent-100)] rounded-full flex items-center justify-center shrink-0">
                <Mail className="w-7 h-7 text-[var(--accent-600)]" />
              </div>
              <div>
                <p className="text-sm text-[var(--gray-500)] mb-1">Email</p>
                <p className="text-xl font-semibold text-[var(--gray-900)]">
                  {CONTACTS.email}
                </p>
              </div>
            </a>
          </div>

          {/* Address & Map */}
          <div className="space-y-4">
            {/* Address Card */}
            <div className="p-6 bg-white rounded-xl border border-[var(--gray-200)]">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-14 h-14 bg-[var(--gray-100)] rounded-full flex items-center justify-center shrink-0">
                  <MapPin className="w-7 h-7 text-[var(--gray-600)]" />
                </div>
                <div>
                  <p className="text-sm text-[var(--gray-500)] mb-1">Адрес</p>
                  <p className="text-xl font-semibold text-[var(--gray-900)]">
                    {CONTACTS.address}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-[var(--gray-100)] rounded-full flex items-center justify-center shrink-0">
                  <Clock className="w-7 h-7 text-[var(--gray-600)]" />
                </div>
                <div>
                  <p className="text-sm text-[var(--gray-500)] mb-1">
                    Время работы
                  </p>
                  {CONTACTS.workSchedule.map((line, index) => (
                    <p 
                      key={index} 
                      className={`font-medium ${index === CONTACTS.workSchedule.length - 1 ? "text-[var(--gray-500)]" : "text-[var(--gray-900)]"}`}
                    >
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>

            {/* Yandex Map */}
            <div className="relative bg-[var(--gray-200)] rounded-xl overflow-hidden h-64 md:h-80">
              <iframe
                src={`https://yandex.ru/map-widget/v1/?text=${encodeURIComponent(CONTACTS.address)}&z=15`}
                width="100%"
                height="100%"
                frameBorder="0"
                allowFullScreen
                style={{ position: 'absolute', top: 0, left: 0 }}
                title={`Яндекс Карта — ${SITE_BRAND}`}
              />
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-[var(--primary-600)] to-[var(--primary-800)] rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Готовы сдать радиодетали?
          </h2>
          <p className="text-lg text-white/80 mb-6 max-w-2xl mx-auto">
            Позвоните нам или напишите в мессенджер — мы ответим на все вопросы
            и поможем с оценкой ваших деталей.
          </p>
          <Link
            href="/catalog"
            className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white font-semibold rounded-lg transition-colors"
          >
            Перейти в каталог
          </Link>
        </div>
      </div>
    </div>
  );
}
