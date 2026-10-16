import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";

interface CategoryShowcaseCardProps {
  product: {
    id: string;
    name: string;
    image: string | null;
  };
  categorySlug: string;
  categoryName: string;
  price: number | null;
}

// Форматирование цены
function formatPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export function CategoryShowcaseCard({
  product,
  categorySlug,
  categoryName,
  price,
}: CategoryShowcaseCardProps) {
  return (
    <Link
      href={`/catalog/${categorySlug}`}
      className="group block bg-white rounded-xl border border-[var(--gray-200)] hover:border-[var(--accent-400)] hover:shadow-xl transition-all duration-300 overflow-hidden"
    >
      {/* Фото товара */}
      <div className="relative h-28 md:h-40 bg-[var(--gray-100)] overflow-hidden shadow-sm">
        {product.image ? (
          <Image
            src={product.image}
            alt={categoryName}
            fill
            className="object-contain p-2 group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 16vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-12 h-12 text-[var(--gray-300)]" />
          </div>
        )}
      </div>

      {/* Информация */}
      <div className="p-2 md:p-4">
        {/* Название категории */}
        <h3 className="font-bold text-[var(--gray-900)] text-sm leading-tight mb-2 line-clamp-2 group-hover:text-[var(--primary-600)] transition-colors">
          {categoryName}
        </h3>

        {/* Цена */}
        {price !== null && price > 0 && (
          <p className="text-lg font-bold text-[var(--accent-600)]">
            от {formatPrice(price)}
          </p>
        )}
      </div>
    </Link>
  );
}
