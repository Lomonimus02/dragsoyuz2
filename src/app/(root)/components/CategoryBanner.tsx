import Link from "next/link";
import Image from "next/image";
import { AlertTriangle, BookOpen, ArrowRight } from "@/app/(root)/components/icons";
import {
  type CategoryBannerConfig,
  type CategoryBannerAlign,
  type CategoryBannerTheme,
  getBannerAlignClasses,
  getBannerThemeStyle,
  resolveBannerDisplay,
  resolveCategoryBannerContent,
} from "@/lib/category-banner";
import {
  INFO_PAGE_BUTTON_DEFAULT_COLOR,
  INFO_PAGE_BUTTON_DEFAULT_TEXT_COLOR,
  normalizeInfoPageButtonColor,
  resolveInfoButtonLabel,
} from "@/lib/category-info";

export interface CategoryBannersProps {
  categoryName: string;
  categorySlug: string;
  warningMessage?: string | null;
  banner: CategoryBannerConfig;
  bannerTextLegacy?: string | null;
  infoPageEnabled?: boolean;
  infoPageButtonLabel?: string | null;
  infoPageButtonColor?: string | null;
  infoPageButtonTextColor?: string | null;
  categoryTitleInHeading?: boolean;
}

function getDecorLineColor(
  textColor: string | null | undefined,
  theme: CategoryBannerTheme,
  hasImage: boolean,
): string {
  if (textColor) return textColor;
  if (theme === "BRAND" || (theme === "IMAGE" && hasImage)) {
    return "rgba(255, 255, 255, 0.5)";
  }
  if (theme === "NOTICE" || theme === "ACCENT") {
    return "rgba(120, 53, 15, 0.35)";
  }
  return "rgba(100, 116, 139, 0.45)";
}

function BannerDecorLine({
  color,
}: {
  color: string;
}) {
  return (
    <div
      className="h-[2px] min-w-[3.5rem] md:min-w-[5rem] flex-1 shrink"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  );
}

function BannerHeading({
  heading,
  align,
  textColor,
  titleLines,
  titleClass,
  lineColor,
}: {
  heading: string;
  align: CategoryBannerAlign;
  textColor?: string | null;
  titleLines: boolean;
  titleClass: string;
  lineColor: string;
}) {
  const customTextStyle = textColor ? { color: textColor } : undefined;

  if (!titleLines) {
    return (
      <p
        className={`text-sm md:text-base font-semibold leading-snug ${textColor ? "" : titleClass}`}
        style={customTextStyle}
      >
        {heading}
      </p>
    );
  }

  const rowAlign =
    align === "CENTER"
      ? "justify-center"
      : align === "RIGHT"
        ? "justify-end"
        : "justify-start";

  return (
    <div
      className={`flex w-full self-stretch items-center gap-3 md:gap-5 ${rowAlign}`}
    >
      {(align === "CENTER" || align === "RIGHT") && (
        <BannerDecorLine color={lineColor} />
      )}
      <p
        className={`shrink-0 text-sm md:text-base font-semibold leading-snug ${
          textColor ? "" : titleClass
        }`}
        style={customTextStyle}
      >
        {heading}
      </p>
      {(align === "CENTER" || align === "LEFT") && (
        <BannerDecorLine color={lineColor} />
      )}
    </div>
  );
}

interface BannerBlockProps {
  heading?: string | null;
  body: string;
  theme: CategoryBannerTheme;
  align: CategoryBannerConfig["align"];
  imageUrl?: string | null;
  linkUrl?: string | null;
  linkLabel?: string | null;
  textColor?: string | null;
  titleLines: boolean;
  showNoticeIcon?: boolean;
}

function CategoryBannerBlock({
  heading,
  body,
  theme,
  align,
  imageUrl,
  linkUrl,
  linkLabel,
  textColor,
  titleLines,
  showNoticeIcon,
}: BannerBlockProps) {
  const hasImage = theme === "IMAGE" && !!imageUrl;
  const styles = getBannerThemeStyle(theme, hasImage);
  const alignClasses = getBannerAlignClasses(align);
  const customTextStyle = textColor ? { color: textColor } : undefined;
  const lineColor = getDecorLineColor(textColor, theme, hasImage);

  return (
    <div
      className={`rk-category-notice relative overflow-hidden rounded-2xl border p-5 md:p-6 ${styles.shell}`}
    >
      {hasImage && imageUrl && (
        <>
          <Image
            src={imageUrl}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 1200px"
          />
          <div className={`absolute inset-0 ${styles.overlay}`} />
        </>
      )}

      <div
        className={`relative z-10 flex w-full flex-col gap-3 self-stretch ${alignClasses.outer} ${alignClasses.text}`}
      >
        {showNoticeIcon && theme === "NOTICE" && !titleLines && (
          <div
            className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${styles.icon} ${alignClasses.icon}`}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
        )}

        {heading && (
          <BannerHeading
            heading={heading}
            align={align}
            textColor={textColor}
            titleLines={titleLines}
            titleClass={styles.title}
            lineColor={lineColor}
          />
        )}

        {body && (
          <p
            className={`text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium ${
              textColor ? "" : styles.text
            }`}
            style={customTextStyle}
          >
            {body}
          </p>
        )}

        {linkUrl && linkLabel && (
          <a
            href={linkUrl}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${styles.cta} ${alignClasses.cta}`}
          >
            {linkLabel}
            <ArrowRight className="h-4 w-4" />
          </a>
        )}
      </div>
    </div>
  );
}

export function CategoryBanners({
  categoryName,
  categorySlug,
  warningMessage,
  banner,
  bannerTextLegacy,
  infoPageEnabled = false,
  infoPageButtonLabel,
  infoPageButtonColor,
  infoPageButtonTextColor,
  categoryTitleInHeading = false,
}: CategoryBannersProps) {
  const rawContent = resolveCategoryBannerContent(
    warningMessage,
    banner.title,
    bannerTextLegacy,
  );
  const display = resolveBannerDisplay(rawContent, banner.titleLines);

  const showInfoButton = infoPageEnabled;
  // The category name already appears as the page heading. Only omit an exact
  // repeated title with no additional text, image or link; keep all authored content.
  const repeatsPageTitle = categoryTitleInHeading && display &&
    [display.heading, display.body].filter(Boolean).length === 1 &&
    (display.heading || display.body).trim().toLocaleLowerCase("ru") === categoryName.trim().toLocaleLowerCase("ru") &&
    !banner.imageUrl && !banner.linkUrl;

  if ((!display || repeatsPageTitle) && !showInfoButton) {
    return null;
  }

  const isPreviewSlug = !categorySlug || categorySlug === "preview";
  const infoHref = isPreviewSlug ? "#" : `/catalog/${categorySlug}/guide`;
  const infoLabel = resolveInfoButtonLabel(infoPageButtonLabel, categoryName);
  const resolvedButtonColor = normalizeInfoPageButtonColor(infoPageButtonColor);
  const resolvedButtonTextColor =
    normalizeInfoPageButtonColor(infoPageButtonTextColor) ??
    INFO_PAGE_BUTTON_DEFAULT_TEXT_COLOR;
  const infoButtonClassName =
    "rk-category-guide-link flex w-full items-center gap-3 bg-[var(--primary-700)] font-semibold text-white transition hover:brightness-90";
  const infoButtonStyle: { backgroundColor?: string; color: string } = {
    color: resolvedButtonTextColor,
  };
  infoButtonStyle.backgroundColor = resolvedButtonColor ?? INFO_PAGE_BUTTON_DEFAULT_COLOR;

  return (
    <div className="rk-category-notices">
      {!repeatsPageTitle && display && (display.heading || display.body) && (
        <CategoryBannerBlock
          heading={display.heading}
          body={display.body}
          theme={banner.theme}
          align={banner.align}
          imageUrl={banner.imageUrl}
          linkUrl={banner.linkUrl?.trim() || null}
          linkLabel={banner.linkLabel?.trim() || null}
          textColor={banner.textColor}
          titleLines={banner.titleLines}
          showNoticeIcon
        />
      )}

      {showInfoButton &&
        (isPreviewSlug ? (
          <span className={infoButtonClassName} style={infoButtonStyle}>
            <BookOpen className="rk-category-guide-icon" aria-hidden />
            <span>{infoLabel}</span>
            <ArrowRight className="rk-category-guide-arrow" aria-hidden />
          </span>
        ) : (
          <Link
            href={infoHref}
            className={infoButtonClassName}
            style={infoButtonStyle}
          >
            <BookOpen className="rk-category-guide-icon" aria-hidden />
            <span>{infoLabel}</span>
            <ArrowRight className="rk-category-guide-arrow" aria-hidden />
          </Link>
        ))}
    </div>
  );
}

/** @deprecated Используйте CategoryBanners */
export function CategoryBanner(props: CategoryBannersProps) {
  return <CategoryBanners {...props} />;
}
