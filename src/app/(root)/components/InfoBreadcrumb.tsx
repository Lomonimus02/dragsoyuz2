import Link from "next/link";
import { ChevronRight } from "./icons";

export function InfoBreadcrumb({ current }: { current: string }) {
  return (
    <nav aria-label="Хлебные крошки" className="rk-info-breadcrumb">
      <Link href="/">Главная</Link>
      <ChevronRight className="w-3 h-3" />
      <span aria-current="page">{current}</span>
    </nav>
  );
}
