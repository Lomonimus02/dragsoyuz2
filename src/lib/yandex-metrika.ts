/** Счётчик РадиоКлада. На Драгсоюз не ставится даже если его номер попал в окружение. */
export const RADIOKLAD_METRIKA_ID = "113820841";

export function resolvePublicMetrikaId(input: {
  theme: string;
  localPreview?: boolean;
  configuredId?: string | null;
}): string | null {
  if (input.localPreview) return null;
  if (input.theme === "radioklad") return RADIOKLAD_METRIKA_ID;

  const configured = input.configuredId?.trim() ?? "";
  if (!configured || configured === RADIOKLAD_METRIKA_ID) return null;
  return /^\d+$/.test(configured) ? configured : null;
}

export function metrikaInlineScript(id: string): string {
  if (!/^\d+$/.test(id)) {
    throw new Error("Metrika id must be digits");
  }

  return `(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};m[i].l=1*new Date();for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${id}', 'ym');ym(${id}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});`;
}

export function metrikaNoscriptSrc(id: string): string {
  if (!/^\d+$/.test(id)) {
    throw new Error("Metrika id must be digits");
  }
  return `https://mc.yandex.ru/watch/${id}`;
}
