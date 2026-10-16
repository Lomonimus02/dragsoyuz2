export const dynamic = 'force-dynamic';

import Link from "next/link";
import {
  Folder,
  FolderOpen,
  ChevronRight,
  Home,
  Plus,
  Package,
  ArrowLeft,
  AlertCircle,
  Pencil,
  Trash2,
  Settings,
} from "lucide-react";
import {
  getSubcategories,
  getCategoryById,
  getCategoryBreadcrumbs,
  getProducts,
  deleteCategory,
  type CategoryData,
  type ProductWithPrice,
} from "@/app/actions";
import ProductsTable from "../components/ProductsTable";
import { DeleteCategoryButton } from "../components/DeleteCategoryButton";

interface CatalogPageProps {
  params: Promise<{ slug?: string[] }>;
}

// Компонент хлебных крошек
function Breadcrumbs({
  items,
}: {
  items: Array<{ id: string; name: string; href: string }>;
}) {
  return (
    <nav className="flex items-center gap-1 text-sm flex-wrap">
      <Link
        href="/admin/catalog"
        className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <Home className="w-4 h-4" />
        <span className="hidden sm:inline">Каталог</span>
      </Link>
      {items.map((item, index) => (
        <span key={item.id} className="flex items-center gap-1">
          <ChevronRight className="w-4 h-4 text-slate-300" />
          {index === items.length - 1 ? (
            <span className="text-slate-900 font-medium">{item.name}</span>
          ) : (
            <Link
              href={item.href}
              className="text-slate-500 hover:text-indigo-600 transition-colors"
            >
              {item.name}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}

// Компонент карточки папки (категории)
function FolderCard({ category }: { category: CategoryData }) {
  const childrenCount = category.childrenCount ?? 0;
  const hasChildren = childrenCount > 0;
  const itemCount = hasChildren ? childrenCount : category.productCount;
  const itemLabel = hasChildren
    ? `${itemCount} подкатегори${itemCount === 1 ? "я" : itemCount < 5 ? "и" : "й"}`
    : `${itemCount} товар${itemCount === 1 ? "" : itemCount < 5 ? "а" : "ов"}`;

  return (
    <Link
      href={`/admin/catalog/${category.id}`}
      className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100 transition-all duration-200"
    >
      {/* Иконка папки */}
      <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gradient-to-br from-amber-100 to-amber-50 flex items-center justify-center group-hover:from-amber-200 group-hover:to-amber-100 transition-colors">
        {hasChildren ? (
          <FolderOpen className="w-6 h-6 text-amber-600" />
        ) : (
          <Folder className="w-6 h-6 text-amber-600" />
        )}
      </div>

      {/* Информация */}
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
          {category.name}
        </h3>
        <p className="text-sm text-slate-500">{itemLabel}</p>
      </div>

      {/* Стрелка */}
      <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
    </Link>
  );
}

// Кнопка "Добавить"
function AddButton({
  type,
  categoryId,
  compact = false,
}: {
  type: "category" | "product";
  categoryId?: string;
  compact?: boolean;
}) {
  const href =
    type === "category"
      ? `/admin/categories/new${categoryId ? `?parentId=${categoryId}` : ""}`
      : `/admin/products/new${categoryId ? `?categoryId=${categoryId}` : ""}`;

  // Полные названия
  const fullLabel = type === "category" 
    ? (categoryId ? "Добавить подкатегорию" : "Добавить категорию")
    : "Добавить товар";
  
  // Короткие названия для мобильных когда 2 кнопки
  const shortLabel = type === "category" 
    ? (categoryId ? "Подкатегория" : "Категория")
    : "Товар";

  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 font-medium text-sm"
    >
      <Plus className="w-4 h-4" />
      {compact ? (
        <>
          <span className="sm:hidden">{shortLabel}</span>
          <span className="hidden sm:inline">{fullLabel}</span>
        </>
      ) : (
        <span>{fullLabel}</span>
      )}
    </Link>
  );
}

// Кнопки управления текущей категорией
function CategoryActions({ categoryId, categoryName, parentId, productCount, childrenCount }: { categoryId: string; categoryName: string; parentId?: string | null; productCount: number; childrenCount: number }) {
  return (
    <div className="flex items-center gap-2 relative">
      <Link
        href={`/admin/categories/${categoryId}/edit`}
        className="inline-flex items-center gap-2 px-3 py-2 text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-colors text-sm font-medium"
        title="Редактировать категорию"
      >
        <Pencil className="w-4 h-4" />
        <span className="hidden sm:inline">Редактировать</span>
      </Link>
      <DeleteCategoryButton categoryId={categoryId} categoryName={categoryName} parentId={parentId} productCount={productCount} childrenCount={childrenCount} />
    </div>
  );
}

// Пустое состояние
function EmptyState({
  type,
  categoryId,
}: {
  type: "categories" | "products";
  categoryId?: string;
}) {
  const isCategory = type === "categories";
  // В корне - "категорий", внутри категории - "подкатегорий"
  const categoryLabel = categoryId ? "подкатегорий" : "категорий";
  const categoryLabelSingle = categoryId ? "подкатегорию" : "категорию";

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
        {isCategory ? (
          <Folder className="w-8 h-8 text-slate-400" />
        ) : (
          <Package className="w-8 h-8 text-slate-400" />
        )}
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-1">
        {isCategory ? `Нет ${categoryLabel}` : "Нет товаров"}
      </h3>
      <p className="text-slate-500 text-center max-w-sm">
        {isCategory
          ? `${categoryId ? "В этой категории" : "В каталоге"} пока нет ${categoryLabel}. Создайте первую ${categoryLabelSingle}!`
          : "В этой категории пока нет товаров. Добавьте первый товар!"}
      </p>
    </div>
  );
}

export default async function CatalogPage({ params }: CatalogPageProps) {
  const { slug } = await params;
  const categoryId = slug?.[0] || null;

  // Получаем данные
  let currentCategory: CategoryData | null = null;
  let breadcrumbItems: Array<{ id: string; name: string; href: string }> = [];
  let subcategories: CategoryData[] = [];
  let products: ProductWithPrice[] = [];
  let hasSubcategories = false;
  let error: string | null = null;

  // Если мы в подкатегории, получаем её данные и хлебные крошки
  if (categoryId) {
    const [categoryResult, breadcrumbsResult] = await Promise.all([
      getCategoryById(categoryId),
      getCategoryBreadcrumbs(categoryId),
    ]);

    if (!categoryResult.success) {
      error = categoryResult.error;
    } else {
      currentCategory = categoryResult.data;
    }

    if (breadcrumbsResult.success) {
      breadcrumbItems = breadcrumbsResult.data.map((item) => ({
        ...item,
        href: `/admin/catalog/${item.id}`,
      }));
    }
  }

  // Если нет ошибки, получаем подкатегории
  if (!error) {
    const subcategoriesResult = await getSubcategories(categoryId);

    if (subcategoriesResult.success) {
      subcategories = subcategoriesResult.data;
      hasSubcategories = subcategories.length > 0;
    }
  }

  // Если мы в категории — загружаем товары (всегда, даже если есть подкатегории)
  if (!error && categoryId) {
    const productsResult = await getProducts({ categoryId, limit: 100 });

    if (productsResult.success) {
      products = productsResult.data;
    }
  }

  // Состояние ошибки
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/catalog"
            className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-slate-900">Ошибка</h1>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-start gap-4">
          <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <div>
            <h3 className="font-medium text-red-900">
              Категория не найдена
            </h3>
            <p className="text-red-700 mt-1">{error}</p>
            <Link
              href="/admin/catalog"
              className="inline-flex items-center gap-2 mt-4 text-red-700 hover:text-red-900 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Вернуться в каталог
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Определяем что показывать
  // Показываем товары если мы в категории и есть товары (или нет подкатегорий)
  const hasProducts = products.length > 0;
  const showCategories = hasSubcategories;
  const showProducts = categoryId && (hasProducts || !hasSubcategories);
  const isEmpty = !hasSubcategories && !hasProducts && categoryId;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          {/* Хлебные крошки */}
          <Breadcrumbs items={breadcrumbItems} />

          {/* Заголовок */}
          <div className="flex items-center gap-3">
            {categoryId && (
              <Link
                href={
                  currentCategory?.parentId
                    ? `/admin/catalog/${currentCategory.parentId}`
                    : "/admin/catalog"
                }
                className="p-2 -ml-2 hover:bg-slate-200 rounded-lg transition-colors"
                title="Назад"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Link>
            )}
            <h1 className="text-2xl font-bold text-slate-900">
              {currentCategory?.name || "Каталог"}
            </h1>
          </div>
        </div>

        {/* Кнопки действий */}
        <div className="flex items-center gap-2">
          {/* Редактировать текущую категорию */}
          {categoryId && currentCategory && (
            <CategoryActions categoryId={categoryId} categoryName={currentCategory.name} parentId={currentCategory.parentId} productCount={currentCategory.productCount} childrenCount={currentCategory.childrenCount ?? 0} />
          )}
          {/* Кнопка добавления товара (когда в категории) */}
          {categoryId && (
            <AddButton
              type="product"
              categoryId={categoryId}
              compact={hasSubcategories}
            />
          )}
          {/* Кнопка добавления категории/подкатегории (только в корне или когда есть подкатегории) */}
          {(!categoryId || hasSubcategories) && (
            <AddButton
              type="category"
              categoryId={categoryId || undefined}
              compact={hasSubcategories}
            />
          )}
        </div>
      </div>

      {/* Предупреждение категории */}
      {currentCategory?.warningMessage && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800">{currentCategory.warningMessage}</p>
        </div>
      )}

      {/* Контент */}
      {/* Если в корне и нет категорий */}
      {!categoryId && subcategories.length === 0 && (
        <EmptyState type="categories" categoryId={undefined} />
      )}

      {/* Подкатегории (если есть) */}
      {showCategories && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subcategories.map((category) => (
              <FolderCard key={category.id} category={category} />
            ))}
          </div>

          {/* Статистика подкатегорий */}
          <div className="pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-500">
              Подкатегорий: <strong>{subcategories.length}</strong>
            </p>
          </div>
        </>
      )}

      {/* Товары категории */}
      {showProducts && (
        <>
          {/* Заголовок секции товаров (если есть и подкатегории) */}
          {hasSubcategories && hasProducts && (
            <div className="pt-4">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">
                Товары в этой категории
              </h2>
            </div>
          )}
          
          {hasProducts ? (
            <ProductsTable
              initialProducts={products}
              categoryId={categoryId!}
              totalCount={products.length}
            />
          ) : (
            <EmptyState type="products" categoryId={categoryId || undefined} />
          )}
        </>
      )}
    </div>
  );
}
