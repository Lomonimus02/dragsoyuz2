import Script from "next/script";
import { IS_LOCAL_PREVIEW } from "@/lib/site";

const JIVO_WIDGET_ID =
  process.env.NEXT_PUBLIC_JIVO_WIDGET_ID?.trim() ?? "";

export function JivoWidget() {
  if (IS_LOCAL_PREVIEW || !JIVO_WIDGET_ID) {
    return null;
  }

  return (
    <Script
      id="jivo-widget"
      src={`https://code.jivo.ru/widget/${JIVO_WIDGET_ID}`}
      strategy="afterInteractive"
    />
  );
}
