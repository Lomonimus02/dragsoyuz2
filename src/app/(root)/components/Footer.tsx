import Link from "next/link";
import { Brand } from "./Brand";
import { MapPin, Phone, Mail, Clock, TelegramIcon, WhatsAppIcon } from "@/app/(root)/components/icons";
import { VkIcon } from "./BrandIcons";
import { ReviewSubmitModal } from "./ReviewSubmitModal";
import { SITE_BRAND, DEFAULT_SITE_EMAIL, DEFAULT_SITE_VK_URL } from "@/lib/site";

// Тип контактных данных для Footer
export interface FooterContactInfo {
  phone: string;
  phoneRaw: string;
  email: string;
  telegram: string;
  vkLink: string;
  whatsappHref?: string;
  address: string;
  workSchedule: string[];
}

// Дефолтные значения на случай если данные не загружены
const DEFAULT_CONTACTS: FooterContactInfo = {
  phone: "+7 (812) 983-49-76",
  phoneRaw: "+78129834976",
  email: DEFAULT_SITE_EMAIL,
  telegram: "dragsoyuz",
  vkLink: DEFAULT_SITE_VK_URL,
  address: "г. Санкт-Петербург",
  workSchedule: ["Пн-Пт: 10:00 - 18:00", "Сб: по записи", "Вс: выходной"],
};

interface FooterProps {
  contactInfo?: FooterContactInfo;
}

export function Footer({ contactInfo }: FooterProps) {
  const CONTACTS = contactInfo || DEFAULT_CONTACTS;
  return (
    <footer className="rk-footer bg-[var(--primary-900)] text-white">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Brand />
            </Link>
            <p className="text-white/60 text-sm leading-relaxed mb-4">
              Профессиональная скупка радиодеталей, содержащих драгоценные
              металлы. Честные цены, быстрая оценка, оплата на месте.
            </p>
            {/* Social Links */}
            <div className="flex gap-3">
              <a
                href={`tel:${CONTACTS.phoneRaw}`}
                className="w-10 h-10 bg-[var(--accent-500)] hover:bg-[var(--accent-600)] rounded-lg flex items-center justify-center transition-colors"
                title="Позвонить"
              >
                <Phone className="w-5 h-5" />
              </a>
              <a
                href={`https://t.me/${CONTACTS.telegram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 bg-[#0088cc] hover:bg-[#0099dd] rounded-lg flex items-center justify-center transition-colors"
                title="Telegram"
              >
                <TelegramIcon className="w-5 h-5" />
              </a>
              {CONTACTS.whatsappHref && (
                <a href={CONTACTS.whatsappHref} target="_blank" rel="noopener noreferrer"
                  className="w-10 h-10 bg-[#128c7e] hover:bg-[#0f7669] rounded-lg flex items-center justify-center transition-colors"
                  title="WhatsApp" aria-label="WhatsApp">
                  <WhatsAppIcon className="w-5 h-5" />
                </a>
              )}
              {CONTACTS.vkLink && (
                <a
                  href={CONTACTS.vkLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-[#0077FF] hover:bg-[#0066dd] rounded-lg flex items-center justify-center transition-colors"
                  title="ВКонтакте"
                >
                  <VkIcon className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Каталог</h4>
            <nav className="flex flex-col gap-2">
              <Link
                href="/catalog"
                className="text-white/60 hover:text-[var(--accent-400)] transition-colors text-sm"
              >
                Все категории
              </Link>
              <Link
                href="/about"
                className="text-white/60 hover:text-[var(--accent-400)] transition-colors text-sm"
              >
                О нас
              </Link>
              <Link
                href="/contacts"
                className="text-white/60 hover:text-[var(--accent-400)] transition-colors text-sm"
              >
                Контакты
              </Link>
            </nav>
          </div>

          {/* Contact Info */}
          <div data-nosnippet="">
            <h4 className="font-semibold text-lg mb-4">Контакты</h4>
            <div className="flex flex-col gap-3">
              <a
                href={`tel:${CONTACTS.phoneRaw}`}
                className="flex items-center gap-3 text-white/60 hover:text-white transition-colors text-sm"
              >
                <Phone className="w-4 h-4 shrink-0 text-[var(--accent-400)]" />
                {CONTACTS.phone}
              </a>
              <a
                href={`https://t.me/${CONTACTS.telegram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-white/60 hover:text-white transition-colors text-sm"
              >
                <TelegramIcon className="w-4 h-4 shrink-0 text-[#0088cc]" />
                Telegram
              </a>
              {CONTACTS.vkLink && (
                <a
                  href={CONTACTS.vkLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-white/60 hover:text-white transition-colors text-sm"
                >
                  <VkIcon className="w-4 h-4 shrink-0 text-[#0077FF]" />
                  ВКонтакте
                </a>
              )}
              {CONTACTS.whatsappHref && (
                <a href={CONTACTS.whatsappHref} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 text-white/60 hover:text-white transition-colors text-sm">
                  <WhatsAppIcon className="w-4 h-4 shrink-0 text-[#25d366]" />
                  WhatsApp
                </a>
              )}
              {CONTACTS.email && (
                <a
                  href={`mailto:${CONTACTS.email}`}
                  className="flex items-center gap-3 text-white/60 hover:text-white transition-colors text-sm"
                >
                  <Mail className="w-4 h-4 shrink-0 text-[var(--accent-400)]" />
                  {CONTACTS.email}
                </a>
              )}
              {CONTACTS.address && (
                <div className="flex items-start gap-3 text-white/60 text-sm">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5 text-[var(--accent-400)]" />
                  <span>{CONTACTS.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Working Hours */}
          <div data-nosnippet="">
            <h4 className="font-semibold text-lg mb-4">Время работы</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3 text-white/60 text-sm">
                <Clock className="w-4 h-4 shrink-0 mt-0.5 text-[var(--accent-400)]" />
                <div>
                  {CONTACTS.workSchedule.map((line, index) => (
                    <p key={index} className={index === CONTACTS.workSchedule.length - 1 ? "text-white/40" : ""}>
                      {line}
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <a
                href={`tel:${CONTACTS.phoneRaw}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--accent-500)] hover:bg-[var(--accent-600)] rounded-lg text-sm font-medium transition-colors"
              >
                <Phone className="w-4 h-4" />
                Позвонить
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-white/10">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-white/40">
            <p>© 2026 {SITE_BRAND}. Все права защищены.</p>
            <ReviewSubmitModal />
            <p>Санкт-Петербург</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
