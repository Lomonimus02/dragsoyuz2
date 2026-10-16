import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Script from "next/script";
import "./globals.css";
import { SITE_BRAND, SITE_THEME, SITE_URL, YANDEX_METRIKA_ID } from "@/lib/site";

const BASE_URL = SITE_URL;

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#343a40",
  colorScheme: "dark light",
};

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
  },
  title: {
    default: `${SITE_BRAND} — Скупка радиодеталей с драгметаллами`,
    template: `%s | ${SITE_BRAND}`,
  },
  description:
    "Профессиональная скупка радиодеталей, содержащих драгоценные металлы: золото, серебро, платина, палладий. Честные цены по актуальному курсу, быстрая оценка, оплата на месте. Транзисторы, конденсаторы, микросхемы, реле.",
  keywords: [
    "скупка радиодеталей",
    "продать радиодетали",
    "скупка транзисторов",
    "скупка конденсаторов",
    "скупка микросхем",
    "драгоценные металлы",
    "золото в радиодеталях",
    "серебро в радиодеталях",
    "палладий",
    "платина",
  ],
  authors: [{ name: SITE_BRAND }],
  creator: SITE_BRAND,
  publisher: SITE_BRAND,
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: BASE_URL,
    siteName: SITE_BRAND,
    title: `${SITE_BRAND} — Скупка радиодеталей с драгметаллами`,
    description:
      "Профессиональная скупка радиодеталей. Честные цены, быстрая оценка, оплата на месте.",
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_BRAND} — Скупка радиодеталей`,
    description:
      "Профессиональная скупка радиодеталей с драгоценными металлами",
  },
  verification: {
    // Добавьте свои коды верификации
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru" data-theme={SITE_THEME} style={{ backgroundColor: '#343a40' }}>
      <head>
        {/* Explicit theme-color for Telegram/iOS in-app browsers */}
        <meta name="theme-color" content="#343a40" />
        <meta name="msapplication-navbutton-color" content="#343a40" />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        {children}
        <Script
          id="yandex-metrika"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(m,e,t,r,i,k,a){
                m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
                m[i].l=1*new Date();
                for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
                k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
              })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js?id=${YANDEX_METRIKA_ID}', 'ym');

              ym(${YANDEX_METRIKA_ID}, 'init', {
                ssr: true,
                webvisor: true,
                clickmap: true,
                ecommerce: "dataLayer",
                referrer: document.referrer,
                url: location.href,
                accurateTrackBounce: true,
                trackLinks: true
              });
            `,
          }}
        />
        <noscript>
          <div>
            <img src={`https://mc.yandex.ru/watch/${YANDEX_METRIKA_ID}`} style={{ position: 'absolute', left: '-9999px' }} alt="" />
          </div>
        </noscript>
      </body>
    </html>
  );
}
