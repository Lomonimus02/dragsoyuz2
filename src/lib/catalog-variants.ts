import type { ModificationInput } from "@/app/actions/products";

export function modificationValues(m: ModificationInput, index: number) {
  return {
    name: m.name.trim(),
    position: index + 1,
    unitType: m.unitType || null,
    contentAu: m.contentAu ?? 0,
    contentAg: m.contentAg ?? 0,
    contentPt: m.contentPt ?? 0,
    contentPd: m.contentPd ?? 0,
    contentTa: m.contentTa ?? 0,
    contentAuUsed: m.contentAuUsed ?? 0,
    contentAgUsed: m.contentAgUsed ?? 0,
    contentPtUsed: m.contentPtUsed ?? 0,
    contentPdUsed: m.contentPdUsed ?? 0,
    contentTaUsed: m.contentTaUsed ?? 0,
  };
}

export function buildVariantMutation(input: ModificationInput[]) {
  const rows = input.map((m, index) => ({ id: m.rowId, data: modificationValues(m, index) }));
  const ids = rows.flatMap(row => row.id ? [row.id] : []);
  if (new Set(ids).size !== ids.length) throw new Error("Строка таблицы указана дважды");
  return {
    deleteMany: ids.length ? { id: { notIn: ids } } : {},
    update: rows.flatMap(row => row.id ? [{ where: { id: row.id }, data: row.data }] : []),
    create: rows.filter(row => !row.id).map(row => row.data),
  };
}
