/**
 * Square mark paths. RadioKlad serves the Rk monogram. DragSoyuz keeps the
 * previous antenna mark, including when this repo is built with its theme.
 */
const DRAGSOYUZ_THEME = "dragsoyuz";

export function isDragsoyuzTheme(theme: string): boolean {
  return theme === DRAGSOYUZ_THEME;
}

export function brandIconPath(theme: string): string {
  return isDragsoyuzTheme(theme) ? "/brand/dragsoyuz/icon.svg" : "/icon.svg";
}

export function brandLogoPath(theme: string): string {
  return isDragsoyuzTheme(theme) ? "/brand/dragsoyuz/logo.svg" : "/logo.svg";
}

type IconDescriptor = { url: string; sizes?: string; type?: string };

export function brandIcons(theme: string): { icon: IconDescriptor[]; apple?: IconDescriptor[] } {
  if (isDragsoyuzTheme(theme)) {
    return {
      icon: [{ url: "/brand/dragsoyuz/icon.svg", type: "image/svg+xml" }],
    };
  }

  return {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icons/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  };
}

/** Raster files added for RadioKlad. A DragSoyuz build must not publish them. */
export const RADIOKLAD_RASTER_ICONS = [
  "public/favicon.ico",
  "public/apple-touch-icon.png",
  "public/icons/icon-32.png",
  "public/icons/icon-192.png",
  "public/icons/icon-512.png",
] as const;
