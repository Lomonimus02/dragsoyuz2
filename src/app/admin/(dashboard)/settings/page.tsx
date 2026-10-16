import { Megaphone, Shield } from "lucide-react";
import { getGlobalSettings } from "@/app/actions";
import {
  DEFAULT_PROMO_BUTTON_CAPTION,
  DEFAULT_PROMO_BUTTON_LABEL,
  DEFAULT_PROMO_BUTTON_URL,
  DEFAULT_PROMO_TERMS,
  DEFAULT_PROMO_TEXT,
} from "@/lib/promo";
import { ChangePasswordForm } from "./ChangePasswordForm";
import { PromoSettingsForm } from "./PromoSettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settingsResult = await getGlobalSettings();
  const settings = settingsResult.success ? settingsResult.data : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Настройки</h1>
        <p className="mt-1 text-slate-500">
          Управление безопасностью и параметрами системы
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <Megaphone className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-800">Акция</h2>
          </div>
        </div>
        <div className="p-6">
          {!settingsResult.success && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {settingsResult.error}
            </div>
          )}
          <PromoSettingsForm
            initialEnabled={settings?.promoEnabled ?? true}
            initialText={settings?.promoText ?? DEFAULT_PROMO_TEXT}
            initialTerms={settings?.promoTerms ?? DEFAULT_PROMO_TERMS}
            initialButtonUrl={settings?.promoButtonUrl ?? DEFAULT_PROMO_BUTTON_URL}
            initialButtonLabel={settings?.promoButtonLabel ?? DEFAULT_PROMO_BUTTON_LABEL}
            initialButtonCaption={settings?.promoButtonCaption ?? DEFAULT_PROMO_BUTTON_CAPTION}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-4">
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-semibold text-slate-800">Безопасность</h2>
          </div>
        </div>
        <div className="p-6">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
