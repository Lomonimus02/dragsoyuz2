import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Опись",
  description:
    "Опись радиодеталей для оценки на приёмке. Печать и сохранение списка с учётом года выпуска.",
  robots: { index: false, follow: false },
};

export default function CartLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
