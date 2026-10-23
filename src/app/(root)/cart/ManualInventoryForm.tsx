"use client";

import { useEffect, useRef, useState } from "react";
import { prepareManualInventoryLine } from "@/app/actions/manual-inventory";
import { useAdminInventoryStore } from "@/store/admin-inventory-store";
import { manualUnitLabel, type ManualInventoryLine, type ManualInventoryUnit, type ManualInventoryCondition } from "@/lib/manual-inventory";

export function ManualInventoryForm({ line, onClose }: { line: ManualInventoryLine | null; onClose: () => void }) {
  const [name, setName] = useState(line?.name ?? "");
  const [year, setYear] = useState(line?.year ?? "");
  const [condition, setCondition] = useState<ManualInventoryCondition>(line?.condition ?? "unspecified");
  const [unit, setUnit] = useState<ManualInventoryUnit>(line?.unit ?? "PIECE");
  const [quantity, setQuantity] = useState(String(line?.quantity ?? 1).replace(".", ","));
  const [price, setPrice] = useState(line ? String(line.unitPrice).replace(".", ",") : "");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const saveLine = useAdminInventoryStore((state) => state.saveLine);
  const controlClass = "mt-1 w-full rounded-lg border border-[var(--gray-300)] bg-white px-3 py-2 text-base text-[var(--gray-900)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)]";

  useEffect(() => {
    formRef.current?.scrollIntoView({ block: "center" });
    nameRef.current?.focus({ preventScroll: true });
  }, []);

  return <form ref={formRef} aria-label="Ручная позиция описи" className="mb-6 rounded-xl border border-[var(--primary-200)] bg-white p-4 sm:p-6 print:hidden"
    onSubmit={async (event) => {
      event.preventDefault();
      if (saving) return;
      setSaving(true); setError("");
      const number = (value: string) => value.trim() && /^\d+(?:[.,]\d+)?$/.test(value.trim()) ? Number(value.trim().replace(",", ".")) : NaN;
      try {
        const result = await prepareManualInventoryLine({ name, year, condition, unit, quantity: number(quantity), unitPrice: number(price) });
        if (!result.success) { setError(result.error); return; }
        saveLine(line?.id ?? null, result.data);
        onClose();
      } catch { setError("Не удалось сохранить позицию. Проверьте соединение и попробуйте снова."); }
      finally { setSaving(false); }
    }}>
    <h2 className="text-lg font-bold text-[var(--gray-900)]">{line ? "Изменить ручную позицию" : "Добавить позицию вручную"}</h2>
    <p className="mt-1 mb-4 text-sm text-[var(--gray-600)]">Цена задаётся за выбранную единицу. Сумма рассчитывается автоматически. Позиция сохраняется в описи этого браузера.</p>
    <fieldset disabled={saving} className="grid grid-cols-1 sm:grid-cols-2 gap-4 disabled:opacity-70">
      <label className="sm:col-span-2 text-sm font-medium">Наименование
        <input ref={nameRef} name="manualName" required maxLength={200} value={name} onChange={(e) => setName(e.target.value)} className={controlClass} />
      </label>
      <label className="text-sm font-medium">Год выпуска
        <input name="manualYear" maxLength={40} placeholder="Например, 1988 или до 1990" value={year} onChange={(e) => setYear(e.target.value)} className={controlClass} />
      </label>
      <div className="text-sm font-medium"><label htmlFor="manualCondition">Состояние</label>
        <select id="manualCondition" name="manualCondition" value={condition} onChange={(e) => setCondition(e.target.value as ManualInventoryCondition)} className={controlClass}>
          <option value="unspecified">Не указано</option><option value="new">Новое</option><option value="used">Б/у</option>
        </select>
      </div>
      <div className="text-sm font-medium"><label htmlFor="manualUnit">Единица измерения</label>
        <select id="manualUnit" name="manualUnit" value={unit} onChange={(e) => setUnit(e.target.value as ManualInventoryUnit)} className={controlClass}>
          <option value="PIECE">Штуки</option><option value="GRAM">Граммы</option><option value="KG">Килограммы</option>
        </select>
      </div>
      <label className="text-sm font-medium">Количество, {manualUnitLabel(unit)}
        <input name="manualQuantity" required inputMode={unit === "PIECE" ? "numeric" : "decimal"} value={quantity} onChange={(e) => setQuantity(e.target.value)} className={controlClass} />
      </label>
      <label className="text-sm font-medium">Цена за 1 {manualUnitLabel(unit)}, ₽
        <input name="manualPrice" required inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} className={controlClass} />
      </label>
    </fieldset>
    {error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}
    <div className="mt-5 flex flex-wrap gap-3">
      <button type="submit" disabled={saving} className="rounded-lg bg-[var(--primary-700)] px-5 py-2.5 font-semibold text-white disabled:opacity-60">{saving ? "Сохраняю…" : line ? "Сохранить позицию" : "Добавить в опись"}</button>
      <button type="button" disabled={saving} onClick={onClose} className="rounded-lg border border-[var(--gray-300)] px-5 py-2.5">Отмена</button>
    </div>
  </form>;
}
