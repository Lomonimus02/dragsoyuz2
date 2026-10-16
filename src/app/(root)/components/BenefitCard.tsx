"use client";

import { useState } from "react";
import { Scale, Banknote, TrendingUp, Shield, Clock } from "lucide-react";

interface BenefitCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function BenefitCard({ icon: Icon, title, description }: BenefitCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="flex flex-col items-center text-center p-4 md:p-6 bg-white rounded-xl border border-[var(--gray-200)] hover:shadow-md transition-shadow">
      <div className="w-14 h-14 rounded-full bg-[var(--accent-100)] text-[var(--accent-600)] flex items-center justify-center mb-3">
        <Icon className="w-7 h-7" />
      </div>
      <h3 className="font-semibold text-[var(--gray-900)] mb-2">
        {title}
      </h3>
      {/* Desktop: always visible */}
      <p className="hidden md:block text-sm text-[var(--gray-600)]">
        {description}
      </p>
      {/* Mobile: expandable */}
      <div className="md:hidden w-full">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-sm text-[var(--primary-600)] font-medium cursor-pointer"
          aria-expanded={isOpen}
        >
          {isOpen ? 'Скрыть' : 'Подробнее'}
        </button>
        {isOpen && (
          <p className="text-sm text-[var(--gray-600)] mt-2 animate-[fadeIn_0.2s_ease-out]">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

const benefits = [
  {
    icon: Scale,
    title: "Честные весы",
    description: "Прозрачное взвешивание: вы видите процесс от начала до конца.",
  },
  {
    icon: Banknote,
    title: "Оплата сразу",
    description: "После оценки мы выплачиваем всю сумму наличными или переводом на карту моментально.",
  },
  {
    icon: TrendingUp,
    title: "Актуальные цены",
    description: "Наши цены соответствуют текущей рыночной ситуации, поэтому вы не прогадаете, сдавая детали нам.",
  },
  {
    icon: Shield,
    title: "Гарантия честности",
    description: "Мы работаем абсолютно прозрачно. Вы не отходите от приёмщика ни на шаг.",
  },
  {
    icon: Clock,
    title: "Быстрая оценка",
    description: "Мы работаем оперативно: приносите детали, мы быстро всё посмотрим и посчитаем.",
  },
];

export function BenefitsSection() {
  return (
    <section className="py-16 md:py-20 bg-[var(--gray-100)]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-[var(--gray-900)]">
            Почему выбирают нас
          </h2>
          <p className="text-[var(--gray-600)] mt-2 max-w-2xl mx-auto">
            Мы работаем честно и прозрачно, предлагая лучшие условия на рынке
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {benefits.map((benefit, index) => (
            <BenefitCard
              key={index}
              icon={benefit.icon}
              title={benefit.title}
              description={benefit.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
