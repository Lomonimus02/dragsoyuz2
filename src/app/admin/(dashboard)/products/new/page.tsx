import { getCategories, getMetalRates, getShowcaseFaceForCategory } from "@/app/actions";
import { ProductForm } from "../components/ProductForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// Отключаем статический пререндеринг (требуется БД)
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ categoryId?: string }>;
}

export default async function NewProductPage({ searchParams }: PageProps) {
  const { categoryId } = await searchParams;
  
  const [categoriesResult, metalRatesResult] = await Promise.all([
    getCategories(),
    getMetalRates(),
  ]);

  // Находим категорию если передан categoryId
  const selectedCategory = categoryId && categoriesResult.success
    ? categoriesResult.data.find((c) => c.id === categoryId)
    : null;

  // Получаем инфо о текущем образце витрины
  const showcaseFaceInfo = categoryId
    ? await getShowcaseFaceForCategory(categoryId)
    : null;

  // URL для возврата - в папку каталога или общий список
  const backUrl = categoryId ? `/admin/catalog/${categoryId}` : "/admin/catalog";

  if (!categoriesResult.success) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">
          Ошибка загрузки категорий: {categoriesResult.error}
        </p>
        <Link
          href={backUrl}
          className="inline-flex items-center gap-2 mt-4 text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад в каталог
        </Link>
      </div>
    );
  }

  if (!metalRatesResult.success) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">
          Ошибка загрузки курсов металлов: {metalRatesResult.error}
        </p>
        <Link
          href={backUrl}
          className="inline-flex items-center gap-2 mt-4 text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад в каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={backUrl}
          className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
            Новый товар
          </h1>
          {selectedCategory ? (
            <p className="text-slate-500 mt-1">
              В категории: {selectedCategory.name}
            </p>
          ) : (
            <p className="text-slate-500 mt-1">
              Заполните информацию о товаре
            </p>
          )}
        </div>
      </div>

      {/* Form */}
      <ProductForm 
        categories={categoriesResult.data} 
        metalRates={metalRatesResult.data}
        defaultCategoryId={categoryId}
        redirectPath={backUrl}
        showcaseFaceInfo={showcaseFaceInfo}
      />
    </div>
  );
}
