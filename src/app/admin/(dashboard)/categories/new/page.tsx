import { getCategories } from "@/app/actions";
import { CategoryForm } from "../components/CategoryForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ parentId?: string }>;
}

export default async function NewCategoryPage({ searchParams }: PageProps) {
  const { parentId } = await searchParams;
  const categoriesResult = await getCategories();

  if (!categoriesResult.success) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">
          Ошибка загрузки категорий: {categoriesResult.error}
        </p>
        <Link
          href="/admin/catalog"
          className="inline-flex items-center gap-2 mt-4 text-indigo-600 hover:text-indigo-700"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад в каталог
        </Link>
      </div>
    );
  }

  // Находим родительскую категорию если parentId передан
  const parentCategory = parentId
    ? categoriesResult.data.find((c) => c.id === parentId)
    : null;

  // Путь возврата - в родительскую папку или корень каталога
  const backUrl = parentId ? `/admin/catalog/${parentId}` : "/admin/catalog";

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
            Новая категория
          </h1>
          {parentCategory && (
            <p className="text-slate-500 mt-1">
              В категории: {parentCategory.name}
            </p>
          )}
        </div>
      </div>

      {/* Form */}
      <CategoryForm
        categories={categoriesResult.data}
        defaultParentId={parentId}
        redirectPath={backUrl}
      />
    </div>
  );
}
