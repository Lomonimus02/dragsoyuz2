import Link from "next/link";
import Image from "next/image";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import { ReviewSubmitModal } from "./ReviewSubmitModal";
import { SITE_BRAND } from "@/lib/site";

// Тип контактных данных для Footer
export interface FooterContactInfo {
  phone: string;
  phoneRaw: string;
  email: string;
  telegram: string;
  vkLink: string;
  address: string;
  workSchedule: string[];
}

// Дефолтные значения на случай если данные не загружены
const DEFAULT_CONTACTS: FooterContactInfo = {
  phone: "+7 (812) 983-49-76",
  phoneRaw: "+78129834976",
  email: "info@dragsoyuz.ru",
  telegram: "dragsoyuz",
  vkLink: "https://vk.com/dragsoyuz",
  address: "г. Санкт-Петербург",
  workSchedule: ["Пн-Пт: 10:00 - 18:00", "Сб: по записи", "Вс: выходной"],
};

interface FooterProps {
  contactInfo?: FooterContactInfo;
}

export function Footer({ contactInfo }: FooterProps) {
  const CONTACTS = contactInfo || DEFAULT_CONTACTS;
  return (
    <footer className="bg-[var(--primary-900)] text-white">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Logo & Description */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 flex items-center justify-center">
                <Image src="/icon.svg" alt={SITE_BRAND} width={40} height={40} />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent">{SITE_BRAND}</span>
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
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
              </a>
              {CONTACTS.vkLink && (
                <a
                  href={CONTACTS.vkLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 bg-[#0077FF] hover:bg-[#0066dd] rounded-lg flex items-center justify-center transition-colors"
                  title="ВКонтакте"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.27-1.422 2.18-3.61 2.18-3.61.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/>
                  </svg>
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
          <div>
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
                <svg className="w-4 h-4 shrink-0 text-[#0088cc]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                </svg>
                Telegram
              </a>
              {CONTACTS.vkLink && (
                <a
                  href={CONTACTS.vkLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 text-white/60 hover:text-white transition-colors text-sm"
                >
                  <svg className="w-4 h-4 shrink-0 text-[#0077FF]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.27-1.422 2.18-3.61 2.18-3.61.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/>
                  </svg>
                  ВКонтакте
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
          <div>
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
