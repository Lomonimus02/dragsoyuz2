import { getProductById, getCategories, getMetalRates, getShowcaseFaceForCategory } from "@/app/actions";
import { ProductForm } from "../components/ProductForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params;
  
  const [productResult, categoriesResult, metalRatesResult] = await Promise.all([
    getProductById(id),
    getCategories(),
    getMetalRates(),
  ]);

  if (!productResult.success) {
    notFound();
  }

  const product = productResult.data;
  
  // Получаем инфо о текущем образце витрины
  const showcaseFaceInfo = await getShowcaseFaceForCategory(product.categoryId);
  
  // URL для возврата - в папку каталога товара
  const backUrl = `/admin/catalog/${product.categoryId}`;

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
            Редактирование товара
          </h1>
          <p className="text-slate-500 mt-1">{product.name}</p>
        </div>
      </div>

      {/* Form */}
      <ProductForm
        product={product}
        categories={categoriesResult.data}
        metalRates={metalRatesResult.data}
        redirectPath={backUrl}
        showcaseFaceInfo={showcaseFaceInfo}
      />
    </div>
  );
}
