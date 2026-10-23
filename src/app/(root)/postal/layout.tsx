import type { Metadata } from "next";
import { SITE_BRAND } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: `Отправить радиодетали почтой — скупка по всей России | ${SITE_BRAND}`,
  description:
    `Сдайте радиодетали почтой или транспортной компанией по всей России. Прозрачная оценка по фото, быстрый расчёт в день приёмки. Компания ${SITE_BRAND}.`,
  path: "/postal",
});

export default function PostalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
