import type { Metadata } from "next";
import { SITE_BRAND, SITE_URL as BASE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: { absolute: `Отправить радиодетали почтой | Скупка по всей России | ${SITE_BRAND}` },
  description:
    `Сдайте радиодетали почтой или транспортной компанией по всей России. Прозрачная оценка по фото, быстрый расчёт в день приёмки. Компания ${SITE_BRAND}.`,
  alternates: {
    canonical: `${BASE_URL}/postal`,
  },
};

export default function PostalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
