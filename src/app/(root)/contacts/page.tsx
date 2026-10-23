import { seoPageCopy } from "@/lib/seo-content";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import {
  Phone,
  Mail,
  MapPin,
  MapPinned,
  Clock,
  TelegramIcon,
  WhatsAppIcon,
  ArrowRight,
} from "@/app/(root)/components/icons";
import { InfoBreadcrumb } from "../components/InfoBreadcrumb";
import { VkIcon } from "../components/BrandIcons";
import { getGlobalSettings } from "@/app/actions";
import { SITE_BRAND, DEFAULT_SITE_EMAIL, DEFAULT_SITE_VK_URL } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";
import { formatWhatsAppHref } from "@/lib/whatsapp";
import { contactMapLinks } from "@/lib/contact-map";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: `Контакты ${SITE_BRAND} — пункт скупки радиодеталей в СПб`,
  description:
    `Свяжитесь с нами для оценки и скупки радиодеталей в Санкт-Петербурге. Телефон, мессенджеры, адрес пункта приёма. Компания ${SITE_BRAND}.`,
  path: "/contacts",
});

// Дефолтные контактные данные
const DEFAULT_CONTACTS = {
  phone: "+7 (812) 983-49-76",
  phoneRaw: "+78129834976",
  email: DEFAULT_SITE_EMAIL,
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
    email: settings?.email?.trim() || DEFAULT_CONTACTS.email,
    telegram: settings?.telegramUsername 
      ? (settings.telegramUsername.startsWith("@") ? settings.telegramUsername : `@${settings.telegramUsername}`)
      : DEFAULT_CONTACTS.telegram,
    telegramUsername: (settings?.telegramUsername || "dragsoyuz").replace(/^@/, "").replace(/^https?:\/\/t\.me\//, ""),
    address: settings?.address || DEFAULT_CONTACTS.address,
    workSchedule: settings?.workSchedule
      ? settings.workSchedule.split("\n").filter(line => line.trim())
      : DEFAULT_CONTACTS.workSchedule,
    storePhotoUrls: settings?.storePhotoUrls ?? [],
    vkLink: settings?.vkLink?.trim() || DEFAULT_SITE_VK_URL,
    whatsappHref: formatWhatsAppHref(settings?.whatsappNumber),
  };
  const mapLinks = contactMapLinks(CONTACTS.address);
  return (
    <div className="rk-info-page rk-contacts-v2">
      <div className="container mx-auto">
        <InfoBreadcrumb current="Контакты" />
        <header className="rk-info-intro rk-contact-intro">
          <h1>{seoPageCopy("/contacts")?.h1}</h1>
          <p className="rk-info-lead">
            Мы всегда рады помочь с оценкой ваших радиодеталей. Выберите удобный
            способ связи.
          </p>
        </header>

        <section className="rk-contact-desk" aria-label="Способы связи">
          <a href={`tel:${CONTACTS.phoneRaw}`} className="rk-contact-phone">
            <span className="rk-contact-label"><Phone />Телефон</span>
            <strong>{CONTACTS.phone}</strong>
            <ArrowRight className="rk-contact-arrow" />
          </a>
          <div className="rk-contact-channels">
            {CONTACTS.vkLink && (
            <a href={CONTACTS.vkLink} target="_blank" rel="noopener noreferrer">
              <VkIcon />
              <span><span className="rk-contact-label">ВКонтакте</span><strong>Написать в VK</strong></span>
              <ArrowRight className="rk-channel-arrow" />
            </a>
            )}
            <a href={`https://t.me/${CONTACTS.telegramUsername}`} target="_blank" rel="noopener noreferrer">
              <TelegramIcon />
              <span><span className="rk-contact-label">Telegram</span><strong>{CONTACTS.telegram}</strong></span>
              <ArrowRight className="rk-channel-arrow" />
            </a>
            {CONTACTS.email && (<a href={`mailto:${CONTACTS.email}`}>
              <Mail />
              <span><span className="rk-contact-label">Email</span><strong>{CONTACTS.email}</strong></span>
              <ArrowRight className="rk-channel-arrow" />
            </a>)}
            {CONTACTS.whatsappHref && (
              <a href={CONTACTS.whatsappHref} target="_blank" rel="noopener noreferrer">
                <WhatsAppIcon />
                <span><span className="rk-contact-label">WhatsApp</span><strong>Написать в WhatsApp</strong></span>
                <ArrowRight className="rk-channel-arrow" />
              </a>
            )}
          </div>
        </section>

        <section className="rk-visit-panel" aria-label="Адрес и время работы">
          <div className="rk-visit-details">
            <div>
              <h2><MapPin />Адрес</h2>
              <p className="rk-visit-address">{CONTACTS.address}</p>
            </div>
            <div className="rk-visit-hours">
              <h2><Clock />Время работы</h2>
              <div>{CONTACTS.workSchedule.map((line, index) => <p key={index}>{line}</p>)}</div>
            </div>
          </div>
          <div className="rk-contact-map">
            {process.env.NEXT_PUBLIC_LOCAL_PREVIEW === "1" ? (
              <div className="rk-map-preview">
                <MapPinned />
                <span>Яндекс Карты</span>
                <p>{CONTACTS.address}</p>
                <a href={mapLinks.external}
                  target="_blank" rel="noopener noreferrer" className="rk-button rk-button-outline">
                  Открыть карту<ArrowRight />
                </a>
              </div>
            ) : (
              <iframe
                src={mapLinks.embed}
                width="100%" height="100%" frameBorder="0" allowFullScreen
                title={`Яндекс Карта — ${SITE_BRAND}`}
              />
            )}
          </div>
        </section>

        {CONTACTS.storePhotoUrls.length > 0 && (
          <div className="rk-store-gallery" data-count={CONTACTS.storePhotoUrls.length}>
            {CONTACTS.storePhotoUrls.map((url, index) => (
              <div key={url} className="rk-store-photo">
                <Image src={url} alt={`Фото магазина ${index + 1}`} width={1200} height={1200} className="rk-store-image"
                  sizes={CONTACTS.storePhotoUrls.length === 1
                    ? "(max-width: 768px) 100vw, 1200px"
                    : "(max-width: 768px) 100vw, 600px"}
                  priority={index === 0} />
              </div>
            ))}
          </div>
        )}

        <section className="rk-info-cta">
          <div>
            <h2>Готовы сдать радиодетали?</h2>
            <p>
              Позвоните нам или напишите в мессенджер — мы ответим на все вопросы
              и поможем с оценкой ваших деталей.
            </p>
          </div>
          <Link href="/catalog" className="rk-button rk-button-primary">
            Перейти в каталог<ArrowRight />
          </Link>
        </section>
      </div>
    </div>
  );
}
