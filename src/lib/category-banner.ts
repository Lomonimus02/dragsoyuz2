import type { CategoryBannerAlign, CategoryBannerTheme } from "@prisma/client";

export type { CategoryBannerAlign, CategoryBannerTheme };

export interface CategoryBannerConfig {
  title: string | null;
  align: CategoryBannerAlign;
  theme: CategoryBannerTheme;
  imageUrl: string | null;
  linkUrl: string | null;
  linkLabel: string | null;
  textColor: string | null;
  titleLines: boolean;
  showGuide: boolean;
}

/** Золотистый пресет для текста баннера */
export const BANNER_GOLD_TEXT_COLOR = "#E8C547";

export const BANNER_TEXT_COLOR_PRESETS: {
  id: "default" | "gold";
  label: string;
  color: string | null;
}[] = [
  { id: "default", label: "По умолчанию", color: null },
  { id: "gold", label: "Золотой", color: BANNER_GOLD_TEXT_COLOR },
];

export function normalizeBannerTextColor(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  if (!trimmed) return null;
  if (/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(trimmed)) return trimmed;
  return null;
}

export const BANNER_ALIGN_OPTIONS: {
  value: CategoryBannerAlign;
  label: string;
}[] = [
  { value: "LEFT", label: "Слева" },
  { value: "CENTER", label: "По центру" },
  { value: "RIGHT", label: "Справа" },
];

export const BANNER_THEME_OPTIONS: {
  value: CategoryBannerTheme;
  label: string;
  description: string;
}[] = [
  { value: "NOTICE", label: "Внимание", description: "Жёлтый — для важных сообщений" },
  { value: "SOFT", label: "Светлый", description: "Нейтральный фон" },
  { value: "BRAND", label: "Бренд", description: "Тёмный фирменный" },
  { value: "ACCENT", label: "Акцент", description: "Золотистый" },
  { value: "IMAGE", label: "С фото", description: "Фоновое изображение" },
];

export function bannerConfigFromCategory(category: {
  warningMessage?: string | null;
  bannerTitle: string | null;
  bannerText: string | null;
  bannerAlign: CategoryBannerAlign;
  bannerTheme: CategoryBannerTheme;
  bannerImageUrl: string | null;
  bannerLinkUrl: string | null;
  bannerLinkLabel: string | null;
  bannerTextColor: string | null;
  bannerTitleLines: boolean;
  bannerShowGuide: boolean;
}): CategoryBannerConfig {
  const hasLegacyWarning = !!category.warningMessage?.trim();
  const textColor = normalizeBannerTextColor(category.bannerTextColor);
  const customized =
    !!category.bannerTitle?.trim() ||
    !!category.bannerText?.trim() ||
    !!category.bannerImageUrl ||
    !!category.bannerLinkUrl?.trim() ||
    !!category.bannerLinkLabel?.trim() ||
    !!textColor ||
    category.bannerTitleLines ||
    category.bannerAlign !== "LEFT" ||
    category.bannerTheme !== "SOFT";

  // Старые warning на проде: без ручной настройки → жёлтый стиль «Внимание»
  const theme =
    hasLegacyWarning && !customized ? "NOTICE" : category.bannerTheme;

  return {
    title: category.bannerTitle,
    align: category.bannerAlign,
    theme,
    imageUrl: category.bannerImageUrl,
    linkUrl: category.bannerLinkUrl,
    linkLabel: category.bannerLinkLabel,
    textColor,
    titleLines: category.bannerTitleLines,
    showGuide: category.bannerShowGuide,
  };
}

/** Текст баннера: warningMessage — основное поле, bannerText — legacy */
export function resolveCategoryBannerContent(
  warningMessage: string | null | undefined,
  bannerTitle: string | null | undefined,
  bannerText: string | null | undefined,
): { title: string | null; text: string } | null {
  const body =
    warningMessage?.trim() || bannerText?.trim() || null;
  const title = bannerTitle?.trim() || null;

  if (body) {
    return { title, text: body };
  }
  if (title) {
    return { title, text: "" };
  }
  return null;
}

/** Заголовок с линиями: только явный bannerTitle или первая строка (если есть перенос) */
export function resolveBannerDisplay(
  content: { title: string | null; text: string } | null,
  titleLines: boolean,
): { heading: string | null; body: string } | null {
  if (!content) return null;

  const title = content.title?.trim() || null;
  const text = content.text;

  if (title) {
    return {
      heading: title,
      body: text,
    };
  }

  if (titleLines) {
    const nl = text.indexOf("\n");
    if (nl > -1) {
      const heading = text.slice(0, nl).trim();
      const body = text.slice(nl + 1).trim();
      if (heading) {
        return { heading, body };
      }
    }
  }

  return { heading: null, body: text };
}

export function getBannerAlignClasses(align: CategoryBannerAlign): {
  outer: string;
  text: string;
  icon: string;
  cta: string;
} {
  switch (align) {
    case "CENTER":
      return {
        outer: "items-center",
        text: "text-center",
        icon: "self-center",
        cta: "self-center",
      };
    case "RIGHT":
      return {
        outer: "items-end",
        text: "text-right",
        icon: "self-end",
        cta: "self-end",
      };
    default:
      return {
        outer: "items-start",
        text: "text-left",
        icon: "self-start",
        cta: "self-start",
      };
  }
}

interface BannerThemeStyle {
  shell: string;
  title: string;
  text: string;
  cta: string;
  icon: string;
  overlay?: string;
}

export function getBannerThemeStyle(
  theme: CategoryBannerTheme,
  hasImage: boolean,
): BannerThemeStyle {
  if (theme === "IMAGE" && hasImage) {
    return {
      shell: "border-white/20 text-white",
      title: "text-white drop-shadow-sm",
      text: "text-white/90",
      cta: "bg-white/95 hover:bg-white text-slate-900",
      icon: "bg-white/20 text-white",
      overlay:
        "bg-gradient-to-r from-slate-950/85 via-slate-900/70 to-slate-900/40",
    };
  }

  switch (theme) {
    case "BRAND":
      return {
        shell: "bg-gradient-to-br from-[var(--primary-900)] via-[var(--primary-800)] to-[var(--primary-900)] border-white/10 shadow-lg shadow-[var(--primary-900)]/20",
        title: "text-white",
        text: "text-white/80",
        cta: "bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white shadow-md shadow-amber-900/20",
        icon: "bg-white/15 text-amber-300",
      };
    case "ACCENT":
      return {
        shell: "bg-gradient-to-br from-amber-50 via-amber-100/80 to-orange-50 border-amber-200/80 shadow-sm",
        title: "text-amber-950",
        text: "text-amber-900/80",
        cta: "bg-[var(--primary-800)] hover:bg-[var(--primary-900)] text-white",
        icon: "bg-amber-200/80 text-amber-800",
      };
    case "NOTICE":
      return {
        shell: "bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-300/80 shadow-sm",
        title: "text-amber-950",
        text: "text-amber-900/85",
        cta: "bg-amber-600 hover:bg-amber-700 text-white",
        icon: "bg-amber-200 text-amber-800",
      };
    case "IMAGE":
      return {
        shell: "bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 text-white",
        title: "text-white",
        text: "text-white/75",
        cta: "bg-[var(--accent-500)] hover:bg-[var(--accent-600)] text-white",
        icon: "bg-white/15 text-amber-300",
      };
    default:
      return {
        shell: "bg-gradient-to-br from-white to-slate-50 border-[var(--gray-200)] shadow-sm",
        title: "text-[var(--gray-900)]",
        text: "text-[var(--gray-600)]",
        cta: "bg-[var(--primary-700)] hover:bg-[var(--primary-800)] text-white",
        icon: "bg-[var(--primary-50)] text-[var(--primary-600)]",
      };
  }
}
