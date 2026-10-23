import assert from "node:assert/strict";
import test from "node:test";
import { sortInventoryByCatalog, type InventoryCatalogCategory } from "./inventory-catalog-order";

const categories: InventoryCatalogCategory[] = [
  { id: "chips", parentId: null, sortOrder: 20, childSortOrder: 2 },
  { id: "capacitors", parentId: null, sortOrder: 10, childSortOrder: 1 },
  { id: "military", parentId: "chips", sortOrder: 1, childSortOrder: 0 },
  { id: "late", parentId: "chips", sortOrder: 3, childSortOrder: 0 },
];
const row = (id: string, categoryId: string, sortOrder: number) => ({ id, categoryId, sortOrder });

test("follows catalog categories and product positions, independent of add order", () => {
  const rows = [row("chip2", "chips", 2), row("cap2", "capacitors", 2), row("chip1", "chips", 1), row("cap1", "capacitors", 1)];
  const result = sortInventoryByCatalog(rows, categories, (item) => item);
  assert.deepEqual(result.map((item) => item.id), ["cap1", "cap2", "chip1", "chip2"]);
  assert.equal(rows[0].id, "chip2");
});

test("places parent products between child categories using childSortOrder", () => {
  const rows = [row("late", "late", 1), row("own", "chips", 1), row("military", "military", 9)];
  assert.deepEqual(sortInventoryByCatalog(rows, categories, (item) => item).map((item) => item.id), ["military", "own", "late"]);
});

test("equal category slots use product order, just like the category page", () => {
  const tied = categories.map((category) => category.id === "military" ? {...category, sortOrder: 2} : category);
  const rows = [row("child2", "military", 2), row("own1", "chips", 1)];
  assert.deepEqual(sortInventoryByCatalog(rows, tied, (item) => item).map((item) => item.id), ["own1", "child2"]);
});

test("preserves the added order of variants and keeps unavailable items at the end", () => {
  const rows = [row("deleted", "missing", 1), row("used", "chips", 2), row("new", "chips", 2), row("unloaded", "chips", 1)];
  assert.deepEqual(sortInventoryByCatalog(rows, categories, (item) => item.id === "unloaded" ? null : item).map((item) => item.id), ["used", "new", "deleted", "unloaded"]);
});

test("reflects a changed catalog category order", () => {
  const changed = categories.map((category) => category.id === "chips" ? {...category, sortOrder: 0} : category);
  const rows = [row("cap", "capacitors", 1), row("chip", "chips", 1)];
  assert.deepEqual(sortInventoryByCatalog(rows, changed, (item) => item).map((item) => item.id), ["chip", "cap"]);
});
