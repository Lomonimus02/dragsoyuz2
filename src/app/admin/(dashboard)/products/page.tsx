import { getProducts } from "@/app/actions";
import { ProductsTable } from "./components/ProductsTable";
import { Plus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const result = await getProducts({ limit: 100 });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
            Товары
          </h1>
          <p className="text-slate-500 mt-1">
            {result.success
              ? `Всего: ${result.total} товар(ов)`
              : "Ошибка загрузки"}
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Добавить товар
        </Link>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {result.success ? (
          <ProductsTable products={result.data} />
        ) : (
          <div className="p-8 text-center text-red-500">
            Ошибка загрузки товаров: {result.error}
          </div>
        )}
      </div>
    </div>
  );
}
