import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  Scale,
  Banknote,
  Shield,
  Clock,
  ArrowRight,
} from "@/app/(root)/components/icons";
import { InfoBreadcrumb } from "../components/InfoBreadcrumb";
import { getGlobalSettings } from "@/app/actions";
import { SITE_BRAND } from "@/lib/site";
import { pageMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata: Metadata = pageMetadata({
  title: `О компании ${SITE_BRAND} — скупка радиодеталей в Санкт-Петербурге`,
  description:
    `${SITE_BRAND} — профессиональная скупка радиодеталей с драгоценными металлами в Санкт-Петербурге. Честное взвешивание, оплата сразу, работаем с физическими и юридическими лицами.`,
  path: "/about",
});

const advantages = [
  {
    icon: Scale,
    title: "Точная оценка",
    description: "Прозрачное взвешивание при клиенте.",
  },
  {
    icon: Banknote,
    title: "Выплаты сразу",
    description: "Наличный и безналичный расчёт — вы получаете деньги в день обращения.",
  },
  {
    icon: Shield,
    title: "Официально",
    description: "Работаем с физическими и юридическими лицами.",
  },
  {
    icon: Clock,
    title: "Экономим время",
    description: "Быстрая приёмка и оценка партии — цените своё время, мы ценим ваше.",
  },
];

export default async function AboutPage() {
  const settingsResult = await getGlobalSettings();
  const aboutText = settingsResult.success ? settingsResult.data.aboutText : "";
  const aboutPhotoUrl = settingsResult.success
    ? settingsResult.data.aboutPhotoUrl
    : "";

  return (
    <div className="rk-info-page rk-about-v2">
      <div className="rk-company-heading">
        <div className="container mx-auto">
          <InfoBreadcrumb current="О компании" />
          <header className="rk-info-intro">
            <h1>О компании «{SITE_BRAND}»</h1>
            <p className="rk-info-lead">
              Профессиональная скупка радиодеталей, содержащих драгоценные
              металлы. Честно, быстро, выгодно.
            </p>
          </header>
        </div>
      </div>

      <div className="container mx-auto">
        <section className="rk-company-story" aria-labelledby="company-story-title">
          <h2 id="company-story-title">Кто мы такие</h2>
          <div className="rk-company-copy">
            {aboutText ? (
              <p className="whitespace-pre-wrap">{aboutText}</p>
            ) : (
              <p className="rk-company-empty">Информация о компании заполняется...</p>
            )}
            {aboutPhotoUrl && (
              <div className="rk-company-photo">
                <Image src={aboutPhotoUrl} alt="О нашей компании" fill
                  className="object-cover" sizes="(max-width: 768px) 100vw, 800px" />
              </div>
            )}
          </div>
        </section>

        <section className="rk-company-values" aria-labelledby="company-values-title">
          <h2 id="company-values-title">Почему выбирают нас</h2>
          <div className="rk-company-values-grid">
            {advantages.map((item) => (
              <article key={item.title}>
                <item.icon />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="rk-info-cta rk-company-cta">
          <div>
            <h2>Готовы выгодно сдать радиодетали?</h2>
            <p>
              Свяжитесь с нами или ознакомьтесь с каталогом принимаемых
              радиодеталей. Мы всегда на связи.
            </p>
          </div>
          <div className="rk-info-cta-actions">
            <Link href="/catalog" className="rk-button rk-button-primary">Перейти в каталог<ArrowRight /></Link>
            <Link href="/contacts" className="rk-button rk-button-outline">Связаться с нами</Link>
          </div>
        </section>
      </div>
    </div>
  );
}
