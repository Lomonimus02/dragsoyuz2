"use client";

import { useEffect } from "react";

const RELOAD_GUARD_KEY = "ios-chrome-just-reloaded";
const PRINT_INTERNAL_CLASS = "print-internal-report";
const APP_HEIGHT_VAR = "--app-height";
const HEIGHT_MISMATCH_PX = 48;
const SKIP_RELOAD_RESET_MS = 3000;
const MISMATCH_CHECK_DELAY_MS = 200;

function isIosChrome(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /CriOS/.test(ua) && /iPhone|iPad|iPod/.test(ua);
}

function clearStaleUi(): void {
  document.body.style.overflow = "";
  document.body.style.touchAction = "";
  document.documentElement.classList.remove(PRINT_INTERNAL_CLASS);
}

function consumeReloadGuard(): boolean {
  try {
    if (sessionStorage.getItem(RELOAD_GUARD_KEY) === "1") {
      sessionStorage.removeItem(RELOAD_GUARD_KEY);
      return true;
    }
  } catch {
    /* ignore */
  }
  return false;
}

function syncAppHeight(): void {
  const vv = window.visualViewport;
  const height = Math.round(vv?.height || window.innerHeight);
  document.documentElement.style.setProperty(APP_HEIGHT_VAR, `${height}px`);
}

function forceReflow(): void {
  window.scrollTo(0, 0);
  void document.documentElement.offsetHeight;
}

function viewportMismatch(): boolean {
  const vv = window.visualViewport;
  const visualHeight = vv?.height ?? window.innerHeight;
  return Math.abs(document.documentElement.clientHeight - visualHeight) > HEIGHT_MISMATCH_PX;
}

export function IosChromeRestoreReload() {
  useEffect(() => {
    let skipReload = consumeReloadGuard();
    const crios = isIosChrome();
    let frozen = false;
    let reloading = false;
    let skipResetTimer: ReturnType<typeof setTimeout> | undefined;
    let mismatchTimer: ReturnType<typeof setTimeout> | undefined;

    if (skipReload) {
      skipResetTimer = setTimeout(() => {
        skipReload = false;
      }, SKIP_RELOAD_RESET_MS);
    }

    const requestReload = () => {
      if (skipReload || !crios || reloading) return;
      reloading = true;
      try {
        sessionStorage.setItem(RELOAD_GUARD_KEY, "1");
      } catch {
        /* ignore */
      }
      window.location.reload();
    };

    const checkMismatchThenReload = () => {
      if (!crios) return;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          clearTimeout(mismatchTimer);
          mismatchTimer = setTimeout(() => {
            if (viewportMismatch()) {
              requestReload();
            }
          }, MISMATCH_CHECK_DELAY_MS);
        });
      });
    };

    const onShow = () => {
      clearStaleUi();
      if (crios) {
        syncAppHeight();
        forceReflow();
      }
    };

    const discarded = Boolean(
      (document as Document & { wasDiscarded?: boolean }).wasDiscarded,
    );
    if (discarded) {
      requestReload();
    }

    if (crios) {
      syncAppHeight();
      checkMismatchThenReload();
    }

    const onPageShow = (event: Event) => {
      onShow();
      const persisted =
        "persisted" in event &&
        Boolean((event as PageTransitionEvent).persisted);
      if (persisted || frozen) {
        frozen = false;
        requestReload();
        return;
      }
      checkMismatchThenReload();
    };

    const onFreeze = () => {
      frozen = true;
    };

    const onResume = () => {
      if (!frozen) return;
      frozen = false;
      requestReload();
    };

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      onShow();
      if (frozen) {
        frozen = false;
        requestReload();
        return;
      }
      checkMismatchThenReload();
    };

    const onViewportSync = () => {
      if (!crios) return;
      syncAppHeight();
    };

    window.addEventListener("pageshow", onPageShow);
    window.addEventListener("resize", onViewportSync);
    document.addEventListener("freeze", onFreeze);
    document.addEventListener("resume", onResume);
    document.addEventListener("visibilitychange", onVisibility);

    const vv = window.visualViewport;
    if (crios && vv) {
      vv.addEventListener("resize", onViewportSync);
      vv.addEventListener("scroll", onViewportSync);
    }

    return () => {
      window.removeEventListener("pageshow", onPageShow);
      window.removeEventListener("resize", onViewportSync);
      document.removeEventListener("freeze", onFreeze);
      document.removeEventListener("resume", onResume);
      document.removeEventListener("visibilitychange", onVisibility);
      if (vv) {
        vv.removeEventListener("resize", onViewportSync);
        vv.removeEventListener("scroll", onViewportSync);
      }
      if (skipResetTimer) clearTimeout(skipResetTimer);
      if (mismatchTimer) clearTimeout(mismatchTimer);
    };
  }, []);

  return null;
}
