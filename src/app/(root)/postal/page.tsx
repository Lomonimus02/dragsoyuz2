"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronRight,
  Send,
  CheckCircle,
  Package,
  ClipboardList,
  Banknote,
  Truck,
  Loader2,
} from "lucide-react";
import { submitPostalRequest } from "@/app/actions";

export default function PostalPage() {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    comment: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitPostalRequest({
        name: formData.name,
        phone: formData.phone,
        comment: formData.comment || undefined,
      });

      if (result.success) {
        setIsSuccess(true);
        setFormData({ name: "", phone: "", comment: "" });
      } else {
        setError(result.error || "Произошла ошибка");
      }
    } catch {
      setError("Произошла ошибка. Попробуйте позже.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-[var(--gray-50)]">
      {/* Breadcrumbs */}
      <div className="bg-white border-b border-[var(--gray-200)]">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-[var(--gray-500)]">
            <Link href="/" className="hover:text-[var(--primary-600)]">
              Главная
            </Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-[var(--gray-900)] font-medium">
              Почтовые отправления
            </span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[var(--primary-100)] rounded-2xl mb-6">
            <Package className="w-8 h-8 text-[var(--primary-600)]" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-[var(--gray-900)] mb-4">
            Сдайте радиодетали быстро и выгодно!
          </h1>
          <p className="text-lg text-[var(--gray-600)] max-w-2xl mx-auto">
            Отправьте нам ваши радиодетали, приборы и сырье, и мы гарантируем
            прозрачную оценку и быстрый расчет.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left: Process steps */}
          <div>
            <h2 className="text-xl font-bold text-[var(--gray-900)] mb-6">
              Простой процесс
            </h2>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-4 p-6 bg-white rounded-xl border border-[var(--gray-200)]">
                <div className="flex-shrink-0 w-12 h-12 bg-[var(--primary-100)] rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-[var(--primary-600)]">
                    1
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--gray-900)] mb-1">
                    Свяжитесь с нами
                  </h3>
                  <p className="text-[var(--gray-600)]">
                    Заполните форму ниже или позвоните нам, чтобы согласовать
                    отправку.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4 p-6 bg-white rounded-xl border border-[var(--gray-200)]">
                <div className="flex-shrink-0 w-12 h-12 bg-[var(--primary-100)] rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-[var(--primary-600)]">
                    2
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--gray-900)] mb-1">
                    Отправьте посылку
                  </h3>
                  <p className="text-[var(--gray-600)]">
                    Не забудьте вложить опись содержимого и ваши реквизиты для
                    оплаты.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4 p-6 bg-white rounded-xl border border-[var(--gray-200)]">
                <div className="flex-shrink-0 w-12 h-12 bg-[var(--primary-100)] rounded-full flex items-center justify-center">
                  <span className="text-lg font-bold text-[var(--primary-600)]">
                    3
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--gray-900)] mb-1">
                    Получите деньги
                  </h3>
                  <p className="text-[var(--gray-600)]">
                    Уже в день приёмки! Мы проводим оценку в течение одного
                    рабочего дня.
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery options */}
            <div className="mt-8 p-6 bg-gradient-to-br from-[var(--primary-50)] to-[var(--primary-100)] rounded-xl">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Truck className="w-6 h-6 text-[var(--primary-600)]" />
                </div>
                <div>
                  <h3 className="font-semibold text-[var(--gray-900)] mb-2">
                    Удобная доставка
                  </h3>
                  <p className="text-[var(--gray-700)]">
                    Выбирайте любой удобный способ доставки:{" "}
                    <strong>«Почта России»</strong> или{" "}
                    <strong>транспортные компании</strong>.
                  </p>
                </div>
              </div>
            </div>

            {/* Benefits */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-[var(--gray-200)]">
                <ClipboardList className="w-5 h-5 text-[var(--primary-600)]" />
                <span className="text-sm font-medium text-[var(--gray-700)]">
                  Прозрачная оценка
                </span>
              </div>
              <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-[var(--gray-200)]">
                <Banknote className="w-5 h-5 text-[var(--primary-600)]" />
                <span className="text-sm font-medium text-[var(--gray-700)]">
                  Быстрый расчет
                </span>
              </div>
            </div>
          </div>

          {/* Right: Contact Form */}
          <div>
            <div className="bg-white rounded-2xl border border-[var(--gray-200)] p-6 md:p-8 shadow-sm">
              <h2 className="text-xl font-bold text-[var(--gray-900)] mb-2">
                Оставьте заявку
              </h2>
              <p className="text-[var(--gray-600)] mb-6">
                Мы свяжемся с вами для уточнения деталей отправки
              </p>

              {isSuccess ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--gray-900)] mb-2">
                    Спасибо за заявку!
                  </h3>
                  <p className="text-[var(--gray-600)] mb-6">
                    Мы свяжемся с вами в ближайшее время.
                  </p>
                  <button
                    onClick={() => setIsSuccess(false)}
                    className="text-[var(--primary-600)] hover:text-[var(--primary-700)] font-medium"
                  >
                    Отправить ещё одну заявку
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-[var(--gray-700)] mb-2"
                    >
                      Ваше имя <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      placeholder="Иван Иванов"
                      className="w-full px-4 py-3 rounded-lg border border-[var(--gray-300)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="block text-sm font-medium text-[var(--gray-700)] mb-2"
                    >
                      Телефон <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      placeholder="+7 (999) 123-45-67"
                      className="w-full px-4 py-3 rounded-lg border border-[var(--gray-300)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent transition-all"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="comment"
                      className="block text-sm font-medium text-[var(--gray-700)] mb-2"
                    >
                      Комментарий{" "}
                      <span className="text-[var(--gray-400)]">
                        (опционально)
                      </span>
                    </label>
                    <textarea
                      id="comment"
                      name="comment"
                      value={formData.comment}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Опишите, какие радиодетали хотите отправить..."
                      className="w-full px-4 py-3 rounded-lg border border-[var(--gray-300)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent transition-all resize-none"
                    />
                  </div>

                  {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-gradient-to-r from-[var(--primary-600)] to-[var(--primary-700)] hover:from-[var(--primary-700)] hover:to-[var(--primary-800)] text-white font-semibold rounded-xl transition-all shadow-lg shadow-[var(--primary-600)]/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Отправка...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Отправить заявку
                      </>
                    )}
                  </button>

                  <p className="text-xs text-center text-[var(--gray-500)]">
                    Нажимая кнопку, вы соглашаетесь с обработкой персональных
                    данных
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
