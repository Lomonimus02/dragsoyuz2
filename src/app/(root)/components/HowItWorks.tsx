import {
  Phone,
  MapPinned,
  Calculator,
  Banknote,
  AlertCircle,
} from "@/app/(root)/components/icons";

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
  const TitleTag = variant === "page" ? "h1" : "h2";
  return (
    <section className="rk-selling-guide">
      <div className="container mx-auto">
        <header className="rk-info-intro rk-selling-intro">
          <TitleTag>Как сдать радиодетали:<span>4 простых шага</span></TitleTag>
          <div className="rk-selling-emblem" aria-hidden="true"><Calculator /></div>
        </header>
        <div className="rk-selling-layout">
          <ol className="rk-selling-steps">
            {steps.map((step, index) => (
              <li key={step.title}>
                <div className="rk-selling-step-marker" aria-hidden="true">
                  <span>{index + 1}</span>
                  <step.icon />
                </div>
                <div>
                  <h3><span>Шаг {index + 1}.</span>{" "}{step.title}</h3>
                  <p>{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
          <aside className="rk-selling-note">
            <AlertCircle />
            <h2>Важная информация</h2>
            <p>
              Не согласны с суммой? Оценка — абсолютно бесплатная. Мы ни на
              чём не настаиваем и ничего не требуем за осмотр.
            </p>
          </aside>
        </div>
      </div>
    </section>
  );
}
