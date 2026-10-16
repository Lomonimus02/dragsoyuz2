"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { deleteProduct, type ProductWithPrice } from "@/app/actions";
import { formatPreciousMetalContent } from "@/lib/price-calculator";
import { getMetalDisplaySymbol } from "@/lib/precious-metals";
import { Edit, Trash2, Loader2, AlertCircle, Package, Star } from "lucide-react";

interface ProductsTableProps {
  products: ProductWithPrice[];
}

export function ProductsTable({ products }: ProductsTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Удалить товар "${name}"?`)) {
      return;
    }

    setError(null);
    setDeletingId(id);

    startTransition(async () => {
      const result = await deleteProduct(id);
      
      if (!result.success) {
        setError(result.error);
      }
      
      setDeletingId(null);
    });
  };

  const formatMetalContent = (product: ProductWithPrice) => {
    const metals = [];
    if (product.contentGold > 0) metals.push(`Au: ${formatPreciousMetalContent("Au", product.contentGold)}`);
    if (product.contentSilver > 0) metals.push(`Ag: ${formatPreciousMetalContent("Ag", product.contentSilver)}`);
    if (product.contentPlatinum > 0) metals.push(`${getMetalDisplaySymbol("Pt")}: ${formatPreciousMetalContent("Pt", product.contentPlatinum)}`);
    if (product.contentPalladium > 0) metals.push(`Pd: ${formatPreciousMetalContent("Pd", product.contentPalladium)}`);
    if (product.contentTantalum > 0) metals.push(`Ta: ${formatPreciousMetalContent("Ta", product.contentTantalum)}`);
    return metals.length > 0 ? metals.join(", ") : "—";
  };

  if (products.length === 0) {
    return (
      <div className="p-12 text-center">
        <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">Товары не найдены</p>
        <Link
          href="/admin/products/new"
          className="inline-block mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Добавить первый товар
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Error notification */}
      {error && (
        <div className="m-4 flex items-center gap-3 p-4 rounded-lg bg-red-50 text-red-800 border border-red-200">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Товар
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Категория
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden lg:table-cell">
                Содержание металлов
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Цена
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {products.map((product) => (
              <tr
                key={product.id}
                className={`hover:bg-slate-50 transition-colors ${
                  deletingId === product.id ? "opacity-50" : ""
                }`}
              >
                {/* Product info */}
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    {/* Image */}
                    <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                    </div>
                    {/* Name */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-slate-800 truncate">
                          {product.name}
                        </p>
                        {product.isShowcaseFace && (
                          <span title="Лицо категории на главной" className="flex-shrink-0">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500 truncate">
                        {product.slug}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Category */}
                <td className="px-4 py-4">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                    {product.categoryName}
                  </span>
                </td>

                {/* Metal content */}
                <td className="px-4 py-4 hidden lg:table-cell">
                  <p className="text-sm text-slate-600 max-w-xs truncate">
                    {formatMetalContent(product)}
                  </p>
                </td>

                {/* Price */}
                <td className="px-4 py-4 text-right">
                  <div className="space-y-1">
                    {/* Единый тип товара - показываем одну цену */}
                    {product.isSingleType ? (
                      product.priceNew !== null && (
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xs px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded">Единая</span>
                          <span className="font-semibold text-slate-800">
                            {product.priceNew.toLocaleString("ru-RU")} ₽
                          </span>
                          {product.manualPriceNew && (
                            <span className="text-xs text-amber-600">Фикс.</span>
                          )}
                        </div>
                      )
                    ) : (
                      <>
                        {product.priceNew !== null && (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded">Новое</span>
                            <span className="font-semibold text-slate-800">
                              {product.priceNew.toLocaleString("ru-RU")} ₽
                            </span>
                            {product.manualPriceNew && (
                              <span className="text-xs text-amber-600">Фикс.</span>
                            )}
                          </div>
                        )}
                        {product.priceUsed !== null && (
                          <div className="flex items-center justify-end gap-1">
                            <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">Б/У</span>
                            <span className="font-semibold text-slate-800">
                              {product.priceUsed.toLocaleString("ru-RU")} ₽
                            </span>
                            {product.manualPriceUsed && (
                              <span className="text-xs text-amber-600">Фикс.</span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Редактировать"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(product.id, product.name)}
                      disabled={isPending && deletingId === product.id}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Удалить"
                    >
                      {isPending && deletingId === product.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
