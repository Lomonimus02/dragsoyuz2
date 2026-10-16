"use client";

import { useCallback, useEffect, useState } from "react";
import { X, Loader2, MessageSquare, CheckCircle } from "lucide-react";
import { submitReview } from "@/app/actions";

export function ReviewSubmitModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const close = useCallback(() => {
    setIsOpen(false);
    setError(null);
    setIsSuccess(false);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSubmitting) close();
    };

    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isSubmitting, close]);

  const handleOpen = () => {
    setName("");
    setText("");
    setError(null);
    setIsSuccess(false);
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitReview(name, text);

      if (result.success) {
        setIsSuccess(true);
        setName("");
        setText("");
      } else {
        setError(result.error || "Произошла ошибка");
      }
    } catch {
      setError("Произошла ошибка. Попробуйте позже.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center gap-1.5 text-white/50 hover:text-[var(--accent-400)] transition-colors text-sm cursor-pointer"
      >
        <MessageSquare className="w-3.5 h-3.5" />
        Оставить отзыв
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSubmitting) close();
          }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <div className="relative w-full max-w-md bg-white text-slate-900 rounded-2xl shadow-2xl">
            <button
              type="button"
              onClick={close}
              disabled={isSubmitting}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-slate-100 transition-colors disabled:opacity-50"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>

            <div className="p-6">
              {isSuccess ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">
                    Спасибо!
                  </h2>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Отзыв отправлен на модерацию и появится после проверки.
                  </p>
                  <button
                    type="button"
                    onClick={close}
                    className="mt-6 px-6 py-2.5 bg-[var(--primary-600)] hover:bg-[var(--primary-700)] text-white rounded-lg font-medium transition-colors"
                  >
                    Закрыть
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-slate-900 mb-2">
                    Оставить отзыв
                  </h2>
                  <p className="text-sm text-slate-500 mb-6">
                    Поделитесь впечатлениями о работе с нами. Отзыв появится на
                    сайте после проверки.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="review-name"
                        className="block text-sm font-medium text-slate-700 mb-1.5"
                      >
                        Ваше имя
                      </label>
                      <input
                        id="review-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Иван"
                        maxLength={100}
                        required
                        className="w-full px-4 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="review-text"
                        className="block text-sm font-medium text-slate-700 mb-1.5"
                      >
                        Ваш отзыв
                      </label>
                      <textarea
                        id="review-text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="Расскажите о вашем опыте..."
                        rows={4}
                        maxLength={2000}
                        required
                        className="w-full px-4 py-2.5 bg-white text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-none"
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[var(--accent-500)] hover:bg-[var(--accent-600)] disabled:opacity-60 text-white rounded-lg font-semibold transition-colors"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Отправка...
                        </>
                      ) : (
                        "Отправить"
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
