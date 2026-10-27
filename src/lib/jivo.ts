/** RadioKlad widget used when NEXT_PUBLIC_JIVO_WIDGET_ID is empty. */
export const RADIOKLAD_JIVO_WIDGET_ID = "aXuLlAFWY4";

export function resolveJivoWidgetId(envValue: string | undefined, theme: string): string {
  const configured = envValue?.trim();
  if (configured) return configured;
  return theme === "radioklad" ? RADIOKLAD_JIVO_WIDGET_ID : "";
}
