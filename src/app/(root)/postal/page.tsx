"use client";

import { seoPageCopy } from "@/lib/seo-content";

import { useState } from "react";
import { InfoBreadcrumb } from "../components/InfoBreadcrumb";
import {
  Send,
  CheckCircle,
  Package,
  ClipboardList,
  Banknote,
  Truck,
  Loader2,
} from "@/app/(root)/components/icons";
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
    <div className="rk-info-page rk-postal-v2">
      <div className="container mx-auto">
        <InfoBreadcrumb current="Почтовые отправления" />
        <header className="rk-info-intro rk-postal-intro">
          <div>
            <h1>{seoPageCopy("/postal")?.h1}</h1>
            <p className="rk-info-lead">
              Отправьте нам ваши радиодетали, приборы и сырье, и мы гарантируем
              прозрачную оценку и быстрый расчет.
            </p>
          </div>
          <div className="rk-postal-assurance">
            <Package className="rk-postal-package" />
            <div><ClipboardList /><span>Прозрачная оценка</span></div>
            <div><Banknote /><span>Быстрый расчет</span></div>
          </div>
        </header>

        <section className="rk-postal-process" aria-labelledby="postal-process-title">
          <h2 id="postal-process-title">Простой процесс</h2>
          <ol className="rk-postal-route">
            <li>
              <span className="rk-route-number" aria-hidden="true">1</span>
              <div>
                <h3>Свяжитесь с нами</h3>
                <p>Заполните форму ниже или позвоните нам, чтобы согласовать отправку.</p>
              </div>
            </li>
            <li>
              <span className="rk-route-number" aria-hidden="true">2</span>
              <div>
                <h3>Отправьте посылку</h3>
                <p>Не забудьте вложить опись содержимого и ваши реквизиты для оплаты.</p>
              </div>
            </li>
            <li>
              <span className="rk-route-number" aria-hidden="true">3</span>
              <div>
                <h3>Получите деньги</h3>
                <p>Уже в день приёмки! Мы проводим оценку в течение одного рабочего дня.</p>
              </div>
            </li>
          </ol>
        </section>

        <div className="rk-postal-request">
          <aside className="rk-delivery-note">
            <Truck className="rk-delivery-icon" />
            <h3>Удобная доставка</h3>
            <p>
              Выбирайте любой удобный способ доставки: <strong>«Почта России»</strong> или{" "}
              <strong>транспортные компании</strong>.
            </p>
            <div className="rk-delivery-track" aria-hidden="true"><span /><span /><span /></div>
          </aside>

          <section className="rk-postal-form-panel" aria-labelledby="postal-form-title">
            <div className="rk-form-heading">
              <h2 id="postal-form-title">Оставьте заявку</h2>
              <p>Мы свяжемся с вами для уточнения деталей отправки</p>
            </div>
            {isSuccess ? (
              <div className="rk-postal-success" role="status">
                <CheckCircle />
                <h3>Спасибо за заявку!</h3>
                <p>Мы свяжемся с вами в ближайшее время.</p>
                <button onClick={() => setIsSuccess(false)} className="rk-button rk-button-outline">
                  Отправить ещё одну заявку
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="rk-postal-form">
                <div className="rk-form-pair">
                  <div className="rk-form-field">
                    <label htmlFor="name">Ваше имя <span className="rk-required">*</span></label>
                    <input type="text" id="name" name="name" value={formData.name}
                      onChange={handleChange} required placeholder="Иван Иванов" autoComplete="name" />
                  </div>
                  <div className="rk-form-field">
                    <label htmlFor="phone">Телефон <span className="rk-required">*</span></label>
                    <input type="tel" id="phone" name="phone" value={formData.phone}
                      onChange={handleChange} required placeholder="+7 (999) 123-45-67" autoComplete="tel" />
                  </div>
                </div>
                <div className="rk-form-field">
                  <label htmlFor="comment">Комментарий <span>(опционально)</span></label>
                  <textarea id="comment" name="comment" value={formData.comment} onChange={handleChange}
                    rows={4} placeholder="Опишите, какие радиодетали хотите отправить..." />
                </div>
                {error && <div className="rk-form-error" role="alert">{error}</div>}
                <div className="rk-form-submit">
                  <button type="submit" disabled={isSubmitting} className="rk-button rk-button-primary">
                    {isSubmitting ? (
                      <><Loader2 className="w-5 h-5 animate-spin" />Отправка...</>
                    ) : (
                      <><Send className="w-5 h-5" />Отправить заявку</>
                    )}
                  </button>
                  <p>Нажимая кнопку, вы соглашаетесь с обработкой персональных данных</p>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
