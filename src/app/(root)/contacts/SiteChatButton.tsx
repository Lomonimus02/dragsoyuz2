"use client";

import { useState, useSyncExternalStore } from "react";
import { ArrowRight, MessageCircle } from "../components/icons";

declare global {
  interface Window {
    jivo_api?: { open: () => { result: string } | void };
    jivo_onLoadCallback?: () => void;
  }
}

function chatIsReady() {
  return typeof window.jivo_api?.open === "function";
}

function subscribeToChat(onReady: () => void) {
  const previousCallback = window.jivo_onLoadCallback;
  function handleLoad() {
    previousCallback?.();
    onReady();
  }
  window.jivo_onLoadCallback = handleLoad;
  return () => {
    if (window.jivo_onLoadCallback === handleLoad) {
      window.jivo_onLoadCallback = previousCallback;
    }
  };
}

export function SiteChatButton() {
  const ready = useSyncExternalStore(subscribeToChat, chatIsReady, () => false);
  const [failed, setFailed] = useState(false);
  if (!ready) return null;

  function openChat() {
    try {
      const api = window.jivo_api;
      setFailed(!api || api.open()?.result === "fail");
    } catch {
      setFailed(true);
    }
  }

  return (
    <>
      <button type="button" onClick={openChat}>
        <MessageCircle />
        <span><span className="rk-contact-label">Онлайн-чат</span><strong>Связаться на сайте</strong></span>
        <ArrowRight className="rk-channel-arrow" />
      </button>
      {failed && <p role="status" className="pb-4">Чат сейчас недоступен. Выберите другой способ связи.</p>}
    </>
  );
}
