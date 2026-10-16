import Link from "next/link";
import {
  Cpu,
  CircuitBoard,
  Radio,
  Disc,
  Cable,
  HardDrive,
  Settings,
  Package,
} from "lucide-react";
import type { CategoryData } from "@/app/actions";

interface CategoryCardProps {
  category: CategoryData;
}

// Icon mapping for categories
function getCategoryIcon(slug: string) {
  const iconMap: Record<string, React.ReactNode> = {
    tranzistory: <Cpu className="w-8 h-8" />,
    transistory: <Cpu className="w-8 h-8" />,
    kondensatory: <CircuitBoard className="w-8 h-8" />,
    condensatory: <CircuitBoard className="w-8 h-8" />,
    mikroshemy: <HardDrive className="w-8 h-8" />,
    microschemy: <HardDrive className="w-8 h-8" />,
    rele: <Radio className="w-8 h-8" />,
    razemy: <Cable className="w-8 h-8" />,
    rezistory: <Disc className="w-8 h-8" />,
    resistory: <Disc className="w-8 h-8" />,
    prochee: <Settings className="w-8 h-8" />,
  };

  return iconMap[slug.toLowerCase()] || <Package className="w-8 h-8" />;
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/catalog?category=${category.id}`}
      className="group flex flex-col items-center p-6 bg-white rounded-xl border border-[var(--gray-200)] hover:border-[var(--accent-400)] hover:shadow-lg transition-all duration-300"
    >
      <div className="w-16 h-16 rounded-full bg-[var(--primary-100)] text-[var(--primary-600)] group-hover:bg-[var(--accent-500)] group-hover:text-white flex items-center justify-center mb-4 transition-all duration-300">
        {getCategoryIcon(category.slug)}
      </div>
      <h3 className="font-semibold text-center text-[var(--gray-800)] group-hover:text-[var(--primary-600)] transition-colors">
        {category.name}
      </h3>
      <p className="text-sm text-[var(--gray-500)] mt-1">
        {category.productCount}{" "}
        {category.productCount === 1
          ? "товар"
          : category.productCount < 5
          ? "товара"
          : "товаров"}
      </p>
    </Link>
  );
}
