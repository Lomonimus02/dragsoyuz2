import test from "node:test";
import assert from "node:assert/strict";
import { shouldApplyYearDiscount, shouldShowYearPicker } from "./inventory-print-groups";
import { DEFAULT_YEAR_PERIOD_DISCOUNTS, resolveLineDiscountPercent } from "./year-discount";
import { accumulateGoldAuByGroup, type InventoryMetalProduct } from "./inventory-metals";

const yearCategories = [
  { categorySlug: "mikroshemy", categoryName: "Микросхемы" },
  { categorySlug: "tranzistory", categoryName: "Транзисторы" },
  { categorySlug: "raz-emy", categoryName: "Разъёмы" },
  { categorySlug: "diody", categoryName: "Диоды" },
];

test("only piece-priced products in the four year-dependent categories ask for year", () => {
  for (const category of yearCategories) {
    for (const unitType of ["PIECE", "KG", "GRAM"] as const) {
      const product = { ...category, unitType };
      assert.equal(shouldShowYearPicker(product), unitType === "PIECE");
      assert.equal(shouldApplyYearDiscount(product), unitType === "PIECE");
    }
  }
});

test("relays, silver, capacitors and other categories never require year", () => {
  for (const categorySlug of ["rele", "tehnicheskoe-serebro", "kondensatory-km", "rezistory", "lampy", "pereklyuchateli", "platinovaya-gruppa", "protsessory-i-platy"]) {
    const product = { categorySlug, unitType: "PIECE" as const, name: "Деталь с диодом и разъёмом" };
    assert.equal(shouldShowYearPicker(product), false, categorySlug);
    assert.equal(shouldApplyYearDiscount(product), false, categorySlug);
  }
});

test("legacy year in a weight-based inventory line cannot reduce its price", () => {
  const savedLine = { yearPeriodId: "from2010" as const, customDiscountPercent: null };
  const product = { categorySlug: "mikroshemy", unitType: "KG" as const };
  assert.equal(resolveLineDiscountPercent(savedLine, DEFAULT_YEAR_PERIOD_DISCOUNTS, shouldApplyYearDiscount(product)), 0);
  const markdown = resolveLineDiscountPercent({ ...savedLine, customDiscountPercent: 10 }, DEFAULT_YEAR_PERIOD_DISCOUNTS, shouldApplyYearDiscount(product));
  assert.ok(Math.abs(markdown - 10) < 1e-10);
  assert.equal(resolveLineDiscountPercent(savedLine, DEFAULT_YEAR_PERIOD_DISCOUNTS, shouldApplyYearDiscount({ ...product, unitType: "PIECE" })), 40);
});

const metalProduct: InventoryMetalProduct = {
  isSingleType: true, unitType: "KG", categorySlug: "mikroshemy", categoryName: "Микросхемы",
  contentGold: 100, contentSilver: 0, contentPlatinum: 0, contentPalladium: 0, contentTantalum: 0,
  contentGoldUsed: 80, contentSilverUsed: 0, contentPlatinumUsed: 0, contentPalladiumUsed: 0, contentTantalumUsed: 0,
  modifications: [],
};
const savedLine = {
  lineId: "saved", productId: "chip", modificationId: null, condition: "new" as const,
  yearPeriodId: "from2010" as const, quantity: 1000, customDiscountPercent: null,
};

test("admin gold report ignores legacy years for weight-based goods but keeps manual markdown", () => {
  const report = (customDiscountPercent: number | null) => accumulateGoldAuByGroup(
    [{ ...savedLine, customDiscountPercent }], { chip: metalProduct }, DEFAULT_YEAR_PERIOD_DISCOUNTS,
  );
  assert.equal(report(null).grand.all, 100);
  assert.equal(report(10).grand.all, 90);
});

test("piece-priced chips retain year adjustment in the admin gold report", () => {
  const result = accumulateGoldAuByGroup([{ ...savedLine, quantity: 2 }],
    { chip: { ...metalProduct, unitType: "PIECE" } }, DEFAULT_YEAR_PERIOD_DISCOUNTS);
  assert.equal(result.grand.all, 120);
});
