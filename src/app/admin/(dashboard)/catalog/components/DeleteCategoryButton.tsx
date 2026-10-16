"use client";

import { useState, useTransition, useEffect } from "react";
import { Trash2, Loader2, AlertTriangle, X } from "lucide-react";
import { deleteCategory } from "@/app/actions";
import { useRouter } from "next/navigation";

interface DeleteCategoryButtonProps {
  categoryId: string;
  categoryName: string;
  parentId?: string | null;
  productCount: number;
  childrenCount: number;
}

export function DeleteCategoryButton({
  categoryId,
  categoryName,
  parentId,
  productCount,
  childrenCount,
}: DeleteCategoryButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const canDelete = productCount === 0 && childrenCount === 0;

  // Закрытие по Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isPending) setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isPending]);

  // Блокировка скролла
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleOpen = () => {
    setError(null);
    setIsOpen(true);
  };

  const handleClose = () => {
    if (!isPending) {
      setIsOpen(false);
      setError(null);
    }
  };

  const handleConfirm = () => {
    setError(null);

    startTransition(async () => {
      const result = await deleteCategory(categoryId);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setIsOpen(false);
      router.push(parentId ? `/admin/catalog/${parentId}` : "/admin/catalog");
    });
  };

  return (
    <>
      {/* Кнопка открытия */}
      <button
        onClick={handleOpen}
        className="inline-flex items-center gap-2 px-3 py-2 text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-colors text-sm font-medium"
        title="Удалить категорию"
      >
        <Trash2 className="w-4 h-4" />
        <span className="hidden sm:inline">Удалить</span>
      </button>

      {/* Модальное окно */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-4">
            {/* Кнопка закрытия */}
            <button
              onClick={handleClose}
              disabled={isPending}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Заголовок */}
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
                      <strong>&quot;{categoryName}&quot;</strong>? Это действие
                      нельзя отменить.
                    </>
                  ) : (
                    <>
                      Категория <strong>&quot;{categoryName}&quot;</strong> не
                      может быть удалена, пока в ней есть содержимое.
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Причины блокировки */}
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

            {/* Ошибка от сервера */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Кнопки */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleClose}
                disabled={isPending}
                className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
              >
                {canDelete ? "Отмена" : "Понятно"}
              </button>
              {canDelete && (
                <button
                  onClick={handleConfirm}
                  disabled={isPending}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Удалить
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
