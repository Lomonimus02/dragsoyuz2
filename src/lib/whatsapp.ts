/** Empty means disabled; null means an invalid phone number. */
export function normalizeWhatsAppNumber(value: string): string | null {
  const input = value.trim();
  if (!input) return "";
  if (!/^\+?[\d\s().-]+$/.test(input)) return null;
  let digits = input.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("8")) digits = `7${digits.slice(1)}`;
  return /^[1-9]\d{7,14}$/.test(digits) ? `+${digits}` : null;
}

export function formatWhatsAppHref(value?: string | null): string {
  const number = normalizeWhatsAppNumber(value ?? "");
  return number ? `https://wa.me/${number.slice(1)}` : "";
}
