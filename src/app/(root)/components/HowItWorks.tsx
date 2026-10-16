import {
  Phone,
  MapPinned,
  Calculator,
  Banknote,
  ArrowDown,
  AlertCircle,
} from "lucide-react";

interface HowItWorksStep {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const steps: HowItWorksStep[] = [
  {
    icon: Phone,
    title: "Свяжитесь с нами.",
    description:
      "Позвоните или напишите в Telegram / ВКонтакте. Если вы не нашли свою радиодеталь на сайте или не знаете, приёмная она или нет, вы можете прислать фото и получить предварительную оценку.",
  },
  {
    icon: MapPinned,
    title: "Приезжаете в офис.",
    description:
      "При Вас производится подсчёт деталей и взвешивание весовых позиций.",
  },
  {
    icon: Calculator,
    title: "Мы считаем итоговую стоимость.",
    description:
      "Осматриваем детали и сверяем с ценами, которые опубликованы на нашем сайте. Никаких «секретных» прайсов — вы сами можете посчитать до приезда.",
  },
  {
    icon: Banknote,
    title: "Получаете деньги.",
    description:
      "Сразу после подсчёта расплачиваемся с Вами наличными. Никаких задержек, очередей и скрытых комиссий.",
  },
];

export function HowItWorks({ variant = "section" }: { variant?: "section" | "page" }) {
  const isPage = variant === "page";
  const TitleTag = isPage ? "h1" : "h2";

  return (
    <section
      className={`relative overflow-hidden py-16 md:py-24 ${
        isPage ? "" : "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
      }`}
    >
      {/* Декоративные размытые элементы */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 container mx-auto px-4">
        {/* Заголовок секции */}
        <div className="text-center mb-12 md:mb-16">
          <TitleTag className="text-2xl md:text-3xl lg:text-4xl font-bold text-white">
            Как сдать радиодетали:
            <span className="block mt-1 sm:inline sm:mt-0 sm:ml-1 bg-gradient-to-r from-amber-300 via-yellow-300 to-amber-300 bg-clip-text text-transparent">
              4 простых шага
            </span>
          </TitleTag>
          <div className="w-20 h-1 bg-gradient-to-r from-amber-400 to-amber-600 rounded-full mx-auto mt-5" />
        </div>

        {/* Вертикальный таймлайн */}
        <div className="max-w-3xl mx-auto">
          {steps.map((step, index) => {
            const isLast = index === steps.length - 1;
            return (
              <div key={index}>
                {/* Блок шага */}
                <div className="group relative flex items-start gap-4 sm:gap-6 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 transition-all duration-300 hover:border-amber-500/40 hover:bg-white/[0.08]">
                  {/* Номер + иконка */}
                  <div className="relative shrink-0">
                    <div className="flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25">
                      <step.icon className="h-7 w-7 sm:h-8 sm:w-8 text-slate-900" />
                    </div>
                    <span className="absolute -top-2 -left-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-amber-400 ring-2 ring-amber-500/60">
                      {index + 1}
                    </span>
                  </div>

                  {/* Текст */}
                  <div className="flex-1 pt-1">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
                      <span className="text-amber-400">Шаг {index + 1}.</span>{" "}
                      {step.title}
                    </h3>
                    <p className="text-sm sm:text-base leading-relaxed text-slate-300">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Стрелка вниз между блоками */}
                {!isLast && (
                  <div className="flex justify-center py-3" aria-hidden="true">
                    <ArrowDown className="h-7 w-7 text-amber-500/70" />
                  </div>
                )}
              </div>
            );
          })}

          {/* Блок "Важная информация" */}
          <div className="mt-10 border-l-4 border-red-500 bg-slate-900 p-6 rounded-r-xl shadow-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-6 w-6 shrink-0 text-red-500 mt-0.5" />
              <div>
                <p className="text-base font-bold text-white mb-1">
                  Важная информация
                </p>
                <p className="text-sm sm:text-base leading-relaxed text-slate-300">
                  Не согласны с суммой? Оценка — абсолютно бесплатная. Мы ни на
                  чём не настаиваем и ничего не требуем за осмотр.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
