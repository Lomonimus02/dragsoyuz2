import { getProductById, getCategories, getMetalRates } from "@/app/actions";
import { ProductForm } from "../../components/ProductForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ categoryId?: string }>;
}

export default async function EditProductPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { categoryId: categoryIdFromUrl } = await searchParams;
  
  const [productResult, categoriesResult, metalRatesResult] = await Promise.all([
    getProductById(id),
    getCategories(),
    getMetalRates(),
  ]);

  if (!productResult.success) {
    notFound();
  }

  const product = productResult.data;
  
  // Используем categoryId из URL параметров или из самого товара
  const categoryId = categoryIdFromUrl || product.categoryId;
  
  // URL для возврата - в папку каталога
  const backUrl = `/admin/catalog/${categoryId}`;
  
  // Путь редиректа после сохранения - в ту же папку
  const redirectPath = backUrl;

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
        redirectPath={redirectPath}
      />
    </div>
  );
}
