import { getCategories, getCategoryById } from "@/app/actions";
import { CategoryForm } from "../../components/CategoryForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCategoryPage({ params }: PageProps) {
  const { id } = await params;

  const [categoryResult, categoriesResult] = await Promise.all([
    getCategoryById(id),
    getCategories(),
  ]);

  if (!categoryResult.success) {
    notFound();
  }

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

  const category = categoryResult.data;

  // Путь возврата - к родителю категории или в корень
  const backUrl = category.parentId
    ? `/admin/catalog/${category.parentId}`
    : "/admin/catalog";

  // Путь редиректа после сохранения - в саму папку этой категории
  const redirectPath = `/admin/catalog/${category.id}`;

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
            Редактирование категории
          </h1>
          <p className="text-slate-500 mt-1">{category.name}</p>
        </div>
      </div>

      {/* Form */}
      <CategoryForm
        categories={categoriesResult.data}
        editCategory={category}
        redirectPath={redirectPath}
      />
    </div>
  );
}
