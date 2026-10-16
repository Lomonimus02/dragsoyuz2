"use client";

import { useState, useCallback, useTransition } from "react";
import Link from "next/link";
import {
  Search,
  Package,
  Pencil,
  Trash2,
  Loader2,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  deleteProduct,
  type ProductWithPrice,
} from "@/app/actions";
import { useRouter } from "next/navigation";

// Хелпер debounce
function useDebounce<T extends (...args: Parameters<T>) => void>(
  callback: T,
  delay: number
): T {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutId) clearTimeout(timeoutId);
      const newTimeoutId = setTimeout(() => callback(...args), delay);
      setTimeoutId(newTimeoutId);
    },
    [callback, delay, timeoutId]
  ) as T;

  return debouncedCallback;
}

// Форматирование цены
function formatPrice(price: number | null): string {
  if (price === null) return "—";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

// Компонент отображения цены
function PriceDisplay({ product }: { product: ProductWithPrice }) {
  const unit = formatUnit(product.unitType);
  
  // Единая цена (isSingleType = true)
  if (product.isSingleType) {
    return (
      <div className="space-y-0.5">
        <div className="flex items-baseline gap-1">
          <span className="font-semibold text-indigo-600">
            {formatPrice(product.priceNew)}
          </span>
          <span className="text-xs text-slate-400">/{unit}</span>
        </div>
        <span className="text-xs text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
          Единая цена
        </span>
      </div>
    );
  }
  
  // Только новое
  if (product.isNewAvailable && !product.isUsedAvailable) {
    return (
      <div className="space-y-0.5">
        <div className="flex items-baseline gap-1">
          <span className="font-semibold text-green-600">
            {formatPrice(product.priceNew)}
          </span>
          <span className="text-xs text-slate-400">/{unit}</span>
        </div>
        <span className="text-xs text-green-600">Новое</span>
      </div>
    );
  }
  
  // Только Б/У
  if (!product.isNewAvailable && product.isUsedAvailable) {
    return (
      <div className="space-y-0.5">
        <div className="flex items-baseline gap-1">
          <span className="font-semibold text-amber-600">
            {formatPrice(product.priceUsed)}
          </span>
          <span className="text-xs text-slate-400">/{unit}</span>
        </div>
        <span className="text-xs text-amber-600">Б/У</span>
      </div>
    );
  }
  
  // Оба типа доступны
  return (
    <div className="space-y-1">
      {product.priceNew !== null && (
        <div className="flex items-baseline gap-1">
          <span className="text-xs text-green-600 font-medium w-10">Нов:</span>
          <span className="font-semibold text-green-600">
            {formatPrice(product.priceNew)}
          </span>
          <span className="text-xs text-slate-400">/{unit}</span>
        </div>
      )}
      {product.priceUsed !== null && (
        <div className="flex items-baseline gap-1">
          <span className="text-xs text-amber-600 font-medium w-10">Б/У:</span>
          <span className="font-semibold text-amber-600">
            {formatPrice(product.priceUsed)}
          </span>
          <span className="text-xs text-slate-400">/{unit}</span>
        </div>
      )}
    </div>
  );
}

// Единица измерения
function formatUnit(unitType: string): string {
  switch (unitType) {
    case "GRAM":
      return "г";
    case "KG":
      return "кг";
    default:
      return "шт";
  }
}

// Модальное окно подтверждения удаления
function DeleteConfirmModal({
  product,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  product: ProductWithPrice;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Удалить товар?
            </h3>
            <p className="text-slate-600 mt-1">
              Вы уверены, что хотите удалить товар{" "}
              <strong>&quot;{product.name}&quot;</strong>? Это действие нельзя отменить.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}

// Компонент карточки товара для мобильных
function ProductCardMobile({
  product,
  categoryId,
  index,
  onDelete,
}: {
  product: ProductWithPrice;
  categoryId: string;
  index: number;
  onDelete: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3">
      {/* Верхняя часть: фото + инфо */}
      <div className="flex gap-4">
        {/* Номер */}
        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
          <span className="text-sm font-medium text-slate-500">{index + 1}</span>
        </div>
        
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-slate-100 overflow-hidden">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-8 h-8 text-slate-400" />
            </div>
          )}
        </div>

        {/* Инфо */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-slate-900 truncate">{product.name}</h3>
          <div className="mt-1">
            <PriceDisplay product={product} />
          </div>
        </div>
      </div>

      {/* Кнопки действий */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <div className="flex-1" />

        {/* Редактировать */}
        <Link
          href={`/admin/products/${product.id}/edit?categoryId=${categoryId}`}
          className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Pencil className="w-4 h-4" />
          <span>Редактировать</span>
        </Link>

        {/* Удалить */}
        <button
          onClick={onDelete}
          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Удалить"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// Строка таблицы для десктопа
function ProductRowDesktop({
  product,
  categoryId,
  index,
  onDelete,
}: {
  product: ProductWithPrice;
  categoryId: string;
  index: number;
  onDelete: () => void;
}) {
  return (
    <tr className="hover:bg-slate-50 transition-colors">
      {/* Порядковый номер */}
      <td className="px-4 py-3">
        <span className="text-sm text-slate-500 font-medium">{index + 1}</span>
      </td>

      {/* Фото */}
      <td className="px-4 py-3">
        <div className="w-12 h-12 rounded-lg bg-slate-100 overflow-hidden">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-6 h-6 text-slate-400" />
            </div>
          )}
        </div>
      </td>

      {/* Название */}
      <td className="px-4 py-3">
        <div className="max-w-xs">
          <span className="font-medium text-slate-900 block truncate">
            {product.name}
          </span>
          <span className="text-sm text-slate-500">{product.slug}</span>
        </div>
      </td>

      {/* Цена */}
      <td className="px-4 py-3">
        <PriceDisplay product={product} />
      </td>

      {/* Действия */}
      <td className="px-4 py-3">
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/admin/products/${product.id}/edit?categoryId=${categoryId}`}
            className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
            title="Редактировать"
          >
            <Pencil className="w-4 h-4" />
          </Link>
          <button
            onClick={onDelete}
            className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Удалить"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// Основной компонент
interface ProductsTableProps {
  initialProducts: ProductWithPrice[];
  categoryId: string;
  totalCount: number;
}

const ITEMS_PER_PAGE = 20;

export default function ProductsTable({
  initialProducts,
  categoryId,
  totalCount,
}: ProductsTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [products, setProducts] = useState(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState(initialProducts);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [deletingProduct, setDeletingProduct] = useState<ProductWithPrice | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Фильтрация по поиску (debounced)
  const filterProducts = useCallback(
    (query: string) => {
      if (!query.trim()) {
        setFilteredProducts(products);
        return;
      }

      const lowerQuery = query.toLowerCase();
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(lowerQuery) ||
          p.slug.toLowerCase().includes(lowerQuery)
      );
      setFilteredProducts(filtered);
    },
    [products]
  );

  const debouncedFilter = useDebounce(filterProducts, 300);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    debouncedFilter(value);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setFilteredProducts(products);
  };

  // Загрузить ещё
  const loadMore = () => {
    setDisplayedCount((prev) => Math.min(prev + ITEMS_PER_PAGE, filteredProducts.length));
  };

  // Удаление товара
  const handleDelete = async () => {
    if (!deletingProduct) return;

    setIsDeleting(true);
    try {
      const result = await deleteProduct(deletingProduct.id);
      if (result.success) {
        const newProducts = products.filter((p) => p.id !== deletingProduct.id);
        setProducts(newProducts);
        setFilteredProducts(
          searchQuery
            ? newProducts.filter(
                (p) =>
                  p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  p.slug.toLowerCase().includes(searchQuery.toLowerCase())
              )
            : newProducts
        );
        setDeletingProduct(null);

        // Обновляем страницу для актуализации счётчиков
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (error) {
      console.error("Failed to delete product:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const displayedProducts = filteredProducts.slice(0, displayedCount);
  const hasMore = displayedCount < filteredProducts.length;

  return (
    <div className="space-y-4">
      {/* Панель инструментов */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        {/* Поиск */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Найти в этой категории..."
            className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Результаты поиска */}
      {searchQuery && (
        <p className="text-sm text-slate-500">
          Найдено: <strong>{filteredProducts.length}</strong> из {products.length}
        </p>
      )}

      {/* Пустое состояние при поиске */}
      {filteredProducts.length === 0 && searchQuery && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-medium text-slate-900 mb-1">Ничего не найдено</h3>
          <p className="text-slate-500 text-sm">
            По запросу &quot;{searchQuery}&quot; товары не найдены
          </p>
          <button
            onClick={clearSearch}
            className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
          >
            Сбросить поиск
          </button>
        </div>
      )}

      {/* Desktop Table */}
      {filteredProducts.length > 0 && (
        <>
          <div className="hidden lg:block bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-16">
                    №
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-20">
                    Фото
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    Название
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider w-44">
                    Цена
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider w-28">
                    Действия
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedProducts.map((product, index) => (
                  <ProductRowDesktop
                    key={product.id}
                    product={product}
                    categoryId={categoryId}
                    index={index}
                    onDelete={() => setDeletingProduct(product)}
                  />
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {displayedProducts.map((product, index) => (
              <ProductCardMobile
                key={product.id}
                product={product}
                categoryId={categoryId}
                index={index}
                onDelete={() => setDeletingProduct(product)}
              />
            ))}
          </div>
        </>
      )}

      {/* Пагинация / Загрузить ещё */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={loadMore}
            className="px-6 py-2.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors font-medium"
          >
            Загрузить ещё ({filteredProducts.length - displayedCount} осталось)
          </button>
        </div>
      )}

      {/* Статистика */}
      <div className="pt-4 border-t border-slate-200">
        <p className="text-sm text-slate-500">
          Показано: <strong>{displayedProducts.length}</strong> из{" "}
          <strong>{filteredProducts.length}</strong>
          {totalCount !== filteredProducts.length && (
            <> (всего в категории: {totalCount})</>
          )}
        </p>
      </div>

      {/* Модальное окно удаления */}
      {deletingProduct && (
        <DeleteConfirmModal
          product={deletingProduct}
          onConfirm={handleDelete}
          onCancel={() => setDeletingProduct(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
