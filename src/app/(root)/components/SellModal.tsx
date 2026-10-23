"use client";

import { useEffect, useCallback, useState } from "react";
import { X, Phone, TelegramIcon, WhatsAppIcon } from "@/app/(root)/components/icons";
import { VkIcon } from "./BrandIcons";
import { useSiteContacts } from "./SiteContactsProvider";
import { DEFAULT_SITE_VK_URL } from "@/lib/site";

export interface SellModalContactInfo {
  phoneNumber: string;
  phoneHref: string;
  telegramHref: string;
  vkHref: string;
  whatsappHref?: string;
}

interface SellModalProps {
  contactInfo?: SellModalContactInfo;
}

const DEFAULT_CONTACTS: SellModalContactInfo = {
  phoneNumber: "+7 (812) 983-49-76",
  phoneHref: "tel:+78129834976",
  telegramHref: "https://t.me/dragsoyuz",
  vkHref: DEFAULT_SITE_VK_URL,
};

export function SellModal({ contactInfo }: SellModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const siteContacts = useSiteContacts();
  const contacts = contactInfo ?? siteContacts ?? DEFAULT_CONTACTS;

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, close]);

  return (
    <>
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white rounded-lg font-semibold transition-colors cursor-pointer"
      >
        Продать
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Dialog */}
          <div className="rk-dialog relative w-full max-w-md bg-white rounded-2xl shadow-2xl animate-[fadeIn_0.2s_ease-out]">
            {/* Close button */}
            <button
              type="button"
              onClick={close}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-[var(--gray-100)] transition-colors cursor-pointer"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5 text-[var(--gray-500)]" />
            </button>

            {/* Content */}
            <div className="p-6">
              <h2 className="text-xl font-bold text-[var(--gray-900)] mb-2">
                Оценить и продать деталь
              </h2>
              <p className="text-sm text-[var(--gray-500)] mb-6">
                Оставьте заявку или свяжитесь с нами удобным способом для быстрой оценки вашей детали.
              </p>

              <div className="flex flex-col gap-3">
                {/* Позвонить */}
                <a
                  href={contacts.phoneHref}
                  className="flex items-center gap-3 px-4 py-3 bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white rounded-xl font-semibold transition-colors"
                >
                  <Phone className="w-5 h-5 shrink-0" />
                  <span>Позвонить {contacts.phoneNumber}</span>
                </a>

                {/* Telegram */}
                <a
                  href={contacts.telegramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-[#229ED9] hover:bg-[#1e8ec4] text-white rounded-xl font-semibold transition-colors"
                >
                  <TelegramIcon className="w-5 h-5 shrink-0" />
                  <span>Написать в Telegram</span>
                </a>

                {/* WhatsApp */}
                {contacts.whatsappHref && (
                  <a href={contacts.whatsappHref} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 bg-[#128c7e] hover:bg-[#0f7669] text-white rounded-xl font-semibold transition-colors">
                    <WhatsAppIcon className="w-5 h-5 shrink-0" />
                    <span>Написать в WhatsApp</span>
                  </a>
                )}

                {/* ВКонтакте */}
                {contacts.vkHref && (
                <a
                  href={contacts.vkHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-3 bg-[#0077FF] hover:bg-[#0066dd] text-white rounded-xl font-semibold transition-colors"
                >
                  <VkIcon className="w-5 h-5 shrink-0" />
                  <span>Написать во ВКонтакте</span>
                </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
