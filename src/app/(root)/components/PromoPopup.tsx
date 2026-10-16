"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";
import { ExternalLink, X } from "lucide-react";
import { PROMO_BUTTON_EMPTY_LABEL, promoButtonHref } from "@/lib/promo";
import { BoldText } from "./BoldText";

const STORAGE_KEY = "dragsoyuz-promo-dismissed";

const listeners = new Set<() => void>();

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function emitDismissChange() {
  listeners.forEach((listener) => listener());
}

function getServerSnapshot() {
  return true;
}

function isDismissed(updatedAt: string): boolean {
  if (!updatedAt) return true;
  try {
    return localStorage.getItem(STORAGE_KEY) === updatedAt;
  } catch {
    return false;
  }
}

type PromoPopupProps = {
  enabled: boolean;
  text: string;
  terms: string;
  updatedAt: string;
  buttonUrl: string;
  buttonLabel: string;
  buttonCaption: string;
};

export function PromoPopup({
  enabled,
  text,
  terms,
  updatedAt,
  buttonUrl,
  buttonLabel,
  buttonCaption,
}: PromoPopupProps) {
  const dismissed = useSyncExternalStore(
    subscribe,
    () => isDismissed(updatedAt),
    getServerSnapshot,
  );

  const close = useCallback(() => {
    try {
      if (updatedAt) {
        localStorage.setItem(STORAGE_KEY, updatedAt);
      }
    } catch {
      // localStorage может быть недоступен
    }
    emitDismissChange();
  }, [updatedAt]);

  const visible = enabled && text.trim().length > 0 && !dismissed;

  useEffect(() => {
    if (!visible) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [visible, close]);

  if (!visible) return null;

  const termsText = terms.trim();
  const buttonHref = promoButtonHref(buttonUrl);
  const buttonText = buttonLabel.trim() || PROMO_BUTTON_EMPTY_LABEL;
  const captionText = buttonCaption.trim();

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4"
      onClick={close}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="promo-popup-title"
        className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-[var(--gray-200)] bg-white shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative border-b border-[var(--gray-200)] px-14 py-3">
          <h2
            id="promo-popup-title"
            className="text-center text-xl font-bold text-[var(--gray-900)]"
          >
            Акция
          </h2>
          <button
            type="button"
            onClick={close}
            aria-label="Закрыть"
            className="absolute right-3 top-1/2 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md bg-red-600 text-white shadow-sm hover:bg-red-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-6">

          <BoldText
            text={text}
            className="mt-4 whitespace-pre-wrap leading-relaxed text-[var(--gray-700)]"
          />

          {termsText ? (
            <div className="mt-5 border-t border-[var(--gray-200)] pt-5">
              <h3 className="text-base font-semibold text-[var(--gray-900)]">Условия</h3>
              <BoldText
                text={termsText}
                className="mt-2 whitespace-pre-wrap leading-relaxed text-[var(--gray-700)]"
              />
            </div>
          ) : null}

          {buttonHref ? (
            <>
              <a
                href={buttonHref}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[var(--primary-900)] px-4 text-sm font-medium text-white hover:bg-[var(--primary-800)]"
              >
                {buttonText}
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
              {captionText ? (
                <p className="mt-2 text-xs text-[var(--gray-500)]">{captionText}</p>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
