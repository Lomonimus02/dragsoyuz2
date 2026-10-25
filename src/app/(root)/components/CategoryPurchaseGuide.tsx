import Link from "next/link";
import { categoryPreparation } from "@/lib/catalog-content";

export function CategoryPurchaseGuide({ name, slug, hasGuide }: { name: string; slug: string; hasGuide: boolean }) {
  const copy = categoryPreparation(name);
  return (
    <section className="rk-purchase-guide rounded-2xl border border-[var(--gray-200)] bg-white p-5 sm:p-8 mt-8" aria-labelledby="category-evaluation">
      <h2 id="category-evaluation" className="text-xl sm:text-2xl font-bold mb-5">Подготовка к оценке: {name}</h2>
      <div className="grid md:grid-cols-3 gap-6 text-sm sm:text-base leading-relaxed text-[var(--gray-700)]">
        <div><h3 className="font-semibold text-[var(--gray-900)] mb-2">1. Определите позицию</h3><p>{copy.identify}</p></div>
        <div><h3 className="font-semibold text-[var(--gray-900)] mb-2">2. Подготовьте фотографии</h3><p>{copy.photos}</p></div>
        <div><h3 className="font-semibold text-[var(--gray-900)] mb-2">3. Уточните подготовку</h3><p>{copy.preparation}</p></div>
      </div>
      <p className="mt-5 text-sm text-[var(--gray-600)]">Единица расчёта указана рядом с ценой каждой позиции: штуки, граммы или килограммы. Предварительную оценку и условия передачи согласуйте до отправки.</p>
      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-[var(--primary-700)]">
        {hasGuide && <Link href={`/catalog/${slug}/guide`}>Подробная информация о категории →</Link>}
        <Link href="/how-to-sell">Как сдать детали →</Link>
        <Link href="/postal">Отправка почтой →</Link>
        <Link href="/contacts">Контакты и оценка →</Link>
      </div>
    </section>
  );
}
