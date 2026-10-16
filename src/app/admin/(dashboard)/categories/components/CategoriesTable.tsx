"use client";

import { useState, useTransition, useEffect } from "react";
import { deleteCategory, type CategoryData } from "@/app/actions";
import { Edit, Trash2, Loader2, AlertTriangle, FolderTree, CornerDownRight, X } from "lucide-react";
import { CategoryFormDialog } from "./CategoryFormDialog";

interface CategoriesTableProps {
  categories: CategoryData[];
}

// Модальное окно подтверждения удаления
function DeleteCategoryModal({
  category,
  onConfirm,
  onCancel,
  isDeleting,
  error,
}: {
  category: CategoryData;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
  error: string | null;
}) {
  const productCount = category.productCount;
  const childrenCount = category.childrenCount ?? 0;
  const canDelete = productCount === 0 && childrenCount === 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDeleting) onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isDeleting, onCancel]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={isDeleting ? undefined : onCancel}
      />
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
        <button
          onClick={onCancel}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
            canDelete ? "bg-red-100" : "bg-amber-100"
          }`}>
            <AlertTriangle className={`w-6 h-6 ${
              canDelete ? "text-red-600" : "text-amber-600"
            }`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              {canDelete ? "Удалить категорию?" : "Невозможно удалить"}
            </h3>
            <p className="text-slate-600 mt-1">
              {canDelete ? (
                <>
                  Вы уверены, что хотите удалить категорию{" "}
                  <strong>&quot;{category.name}&quot;</strong>? Это действие нельзя отменить.
                </>
              ) : (
                <>
                  Категория <strong>&quot;{category.name}&quot;</strong> не может быть удалена, пока в ней есть содержимое.
                </>
              )}
            </p>
          </div>
        </div>

        {!canDelete && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
            {productCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-800">
                <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                <span>
                  В категории{" "}
                  <strong>
                    {productCount} товар{productCount === 1 ? "" : productCount < 5 ? "а" : "ов"}
                  </strong>
                </span>
              </div>
            )}
            {childrenCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-amber-800">
                <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                <span>
                  В категории{" "}
                  <strong>
                    {childrenCount} подкатегори{childrenCount === 1 ? "я" : childrenCount < 5 ? "и" : "й"}
                  </strong>
                </span>
              </div>
            )}
            <p className="text-xs text-amber-700 mt-2">
              Сначала удалите или переместите всё содержимое.
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
          >
            {canDelete ? "Отмена" : "Понятно"}
          </button>
          {canDelete && (
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
              Удалить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function CategoriesTable({ categories }: CategoriesTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<CategoryData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleDeleteOpen = (category: CategoryData) => {
    setError(null);
    setDeleteTarget(category);
  };

  const handleDeleteClose = () => {
    if (!isPending) {
      setDeleteTarget(null);
      setError(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;

    setError(null);
    setDeletingId(deleteTarget.id);

    startTransition(async () => {
      const result = await deleteCategory(deleteTarget.id);

      if (!result.success) {
        setError(result.error);
        setDeletingId(null);
        return;
      }

      setDeletingId(null);
      setDeleteTarget(null);
    });
  };

  if (categories.length === 0) {
    return (
      <div className="p-12 text-center">
        <FolderTree className="w-12 h-12 text-slate-300 mx-auto mb-4" />
        <p className="text-slate-500">Категории не найдены</p>
      </div>
    );
  }

  return (
    <div>
      {/* Delete modal */}
      {deleteTarget && (
        <DeleteCategoryModal
          category={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteClose}
          isDeleting={isPending}
          error={error}
        />
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Название
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Slug
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Родительская
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Товаров
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Действия
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {categories.map((category) => {
              const isSubcategory = category.parentId !== null;
              
              return (
                <tr
                  key={category.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    deletingId === category.id ? "opacity-50" : ""
                  } ${isSubcategory ? "bg-slate-50/50" : ""}`}
                >
                  {/* Name */}
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      {isSubcategory && (
                        <CornerDownRight className="w-4 h-4 text-slate-400 ml-2" />
                      )}
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        isSubcategory 
                          ? "bg-amber-50" 
                          : "bg-indigo-50"
                      }`}>
                        <FolderTree className={`w-5 h-5 ${
                          isSubcategory 
                            ? "text-amber-600" 
                            : "text-indigo-600"
                        }`} />
                      </div>
                      <div className="flex flex-col">
                        <span className={`font-medium ${
                          isSubcategory 
                            ? "text-slate-600" 
                            : "text-slate-800"
                        }`}>
                          {category.name}
                        </span>
                        {isSubcategory && (
                          <span className="text-xs text-amber-600 font-medium">
                            Подкатегория
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                {/* Slug */}
                <td className="px-4 py-4">
                  <code className="text-sm text-slate-600 bg-slate-100 px-2 py-1 rounded">
                    {category.slug}
                  </code>
                </td>

                {/* Parent */}
                <td className="px-4 py-4">
                  {category.parentName ? (
                    <span className="text-slate-600">{category.parentName}</span>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </td>

                {/* Product count */}
                <td className="px-4 py-4 text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      category.productCount > 0
                        ? "bg-green-50 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {category.productCount}
                  </span>
                </td>

                {/* Actions */}
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <CategoryFormDialog
                      categories={categories}
                      editCategory={category}
                      trigger={
                        <button
                          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Редактировать"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      }
                    />
                    <button
                      onClick={() => handleDeleteOpen(category)}
                      disabled={isPending && deletingId === category.id}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                      title="Удалить"
                    >
                      {isPending && deletingId === category.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
