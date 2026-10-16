import { getMetalRates, getProducts, getPinnedCategories, getGlobalSettings } from "@/app/actions";
import { getMetalLabel } from "@/lib/precious-metals";
import { MetalRatesForm } from "./components/MetalRatesForm";
import { PinnedCategoryRatesForm } from "./components/PinnedCategoryRatesForm";
import { ContactSettingsForm } from "./components/ContactSettingsForm";
import { TelegramSettingsForm } from "./components/TelegramSettingsForm";
import { AboutTextForm } from "./components/AboutTextForm";
import { YearPeriodDiscountsForm } from "./components/YearPeriodDiscountsForm";
import { Package, TrendingUp, Phone, Bot, FileText, Percent } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [ratesResult, productsResult, pinnedCategoriesResult, globalSettingsResult] = await Promise.all([
    getMetalRates(),
    getProducts({ limit: 1 }),
    getPinnedCategories(),
    getGlobalSettings(),
  ]);

  const rates = ratesResult.success ? ratesResult.data : null;
  const totalProducts = productsResult.success ? productsResult.total : 0;
  const pinnedCategories = pinnedCategoriesResult.success ? pinnedCategoriesResult.data : [];
  const globalSettings = globalSettingsResult.success ? globalSettingsResult.data : null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">
          Дашборд
        </h1>
        <p className="text-slate-500 mt-1">
          Управление курсами металлов и статистика
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Package className="w-6 h-6" />}
          label="Всего товаров"
          value={totalProducts.toString()}
          color="indigo"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Золото (Au)"
          value={rates ? `${rates.gold.toLocaleString("ru-RU")} ₽/мг` : "—"}
          color="amber"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Серебро (Ag)"
          value={rates ? `${rates.silver.toLocaleString("ru-RU")} ₽/г` : "—"}
          color="slate"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label={getMetalLabel("Pt")}
          value={rates ? `${rates.platinum.toLocaleString("ru-RU")} ₽/мг` : "—"}
          color="cyan"
        />
      </div>

      {/* Metal Rates Form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-6">
          Глобальные курсы металлов
        </h2>
        {rates ? (
          <MetalRatesForm initialRates={rates} />
        ) : (
          <div className="text-red-500">
            Ошибка загрузки курсов:{" "}
            {!ratesResult.success && ratesResult.error}
          </div>
        )}
      </div>

      {/* Pinned Category Rates */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <h2 className="text-xl font-semibold text-slate-800 mb-2">
          Специальные курсы категорий
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Курсы металлов для категорий, закреплённых на дашборде
        </p>
        <PinnedCategoryRatesForm categories={pinnedCategories} />
      </div>

      {/* Year period discounts for calculator */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-amber-50 rounded-lg">
            <Percent className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              Проценты по году выпуска (золото)
            </h2>
            <p className="text-sm text-slate-500">
              Меньше золота — ниже цена в калькуляторе и описи. Каталог без
              изменений.
            </p>
          </div>
        </div>
        {globalSettings ? (
          <YearPeriodDiscountsForm initialData={globalSettings} />
        ) : (
          <div className="text-red-500">
            Ошибка загрузки настроек:{" "}
            {!globalSettingsResult.success && globalSettingsResult.error}
          </div>
        )}
      </div>

      {/* Contact Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-50 rounded-lg">
            <Phone className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              Настройка контактов
            </h2>
            <p className="text-sm text-slate-500">
              Контактные данные для Header, Footer и страницы Контактов
            </p>
          </div>
        </div>
        {globalSettings ? (
          <ContactSettingsForm initialData={globalSettings} />
        ) : (
          <div className="text-red-500">
            Ошибка загрузки настроек:{" "}
            {!globalSettingsResult.success && globalSettingsResult.error}
          </div>
        )}
      </div>

      {/* Telegram Bot Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Bot className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              Telegram-бот для заявок
            </h2>
            <p className="text-sm text-slate-500">
              Настройте бота для получения заявок со страницы «Почтовые отправления»
            </p>
          </div>
        </div>
        {globalSettings ? (
          <TelegramSettingsForm initialData={globalSettings} />
        ) : (
          <div className="text-red-500">
            Ошибка загрузки настроек:{" "}
            {!globalSettingsResult.success && globalSettingsResult.error}
          </div>
        )}
      </div>

      {/* About Text Settings */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <FileText className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-slate-800">
              Текст для страницы «О нас»
            </h2>
            <p className="text-sm text-slate-500">
              Отображается на публичной странице /about
            </p>
          </div>
        </div>
        {globalSettings ? (
          <AboutTextForm initialData={globalSettings} />
        ) : (
          <div className="text-red-500">
            Ошибка загрузки настроек:{" "}
            {!globalSettingsResult.success && globalSettingsResult.error}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "indigo" | "amber" | "slate" | "cyan" | "green";
}) {
  const colorClasses = {
    indigo: "bg-indigo-50 text-indigo-600",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-100 text-slate-600",
    cyan: "bg-cyan-50 text-cyan-600",
    green: "bg-green-50 text-green-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${colorClasses[color]}`}>{icon}</div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="text-xl font-bold text-slate-800">{value}</p>
        </div>
      </div>
    </div>
  );
}
