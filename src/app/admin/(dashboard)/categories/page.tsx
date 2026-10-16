import { getCategories } from "@/app/actions";
import { CategoriesTable } from "./components/CategoriesTable";
import { CategoryFormDialog } from "./components/CategoryFormDialog";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const result = await getCategories();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
            Категории
          </h1>
          <p className="text-slate-500 mt-1">
            {result.success
              ? `Всего: ${result.total} категори${result.total === 1 ? "я" : result.total < 5 ? "и" : "й"}`
              : "Ошибка загрузки"}
          </p>
        </div>

        <CategoryFormDialog categories={result.success ? result.data : []} />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {result.success ? (
          <CategoriesTable categories={result.data} />
        ) : (
          <div className="p-8 text-center text-red-500">
            Ошибка загрузки категорий: {result.error}
          </div>
        )}
      </div>
    </div>
  );
}
