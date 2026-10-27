import Script from "next/script";
import { IS_LOCAL_PREVIEW, SITE_THEME } from "@/lib/site";
import { metrikaInlineScript, metrikaNoscriptSrc, resolvePublicMetrikaId } from "@/lib/yandex-metrika";

export function YandexMetrika() {
  const id = resolvePublicMetrikaId({
    theme: SITE_THEME,
    localPreview: IS_LOCAL_PREVIEW,
    configuredId: process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID,
  });
  if (!id) return null;

  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {metrikaInlineScript(id)}
      </Script>
      <noscript>
        <div>
          {/* Пиксель Метрики должен остаться обычным img: оптимизатор переписал бы адрес. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={metrikaNoscriptSrc(id)}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
