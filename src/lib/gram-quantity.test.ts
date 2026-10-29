import test from "node:test";
import assert from "node:assert/strict";
import {
  computeLineTotal,
  getInventoryPriceUnitSuffix,
  quantityToPriceMultiplier,
  usesGramQuantity,
} from "./gram-quantity";

const pieceCapacitor = {
  unitType: "PIECE" as const,
  categorySlug: "kondensatory-serebro",
  categoryName: "Конденсаторы серебро",
  name: "К52-7",
};

test("piece-priced capacitors are counted per piece, not per gram", () => {
  assert.equal(usesGramQuantity(pieceCapacitor), false);
  assert.equal(computeLineTotal(2314, 1, pieceCapacitor), 2314);
  assert.equal(computeLineTotal(2314, 3, pieceCapacitor), 6942);
  assert.equal(quantityToPriceMultiplier(1, "PIECE", usesGramQuantity(pieceCapacitor)), 1);
  assert.equal(getInventoryPriceUnitSuffix("PIECE", usesGramQuantity(pieceCapacitor)), "/шт.");
});

test("weight-priced goods are still counted in grams", () => {
  const km = { unitType: "KG" as const, categorySlug: "kondensatory-km", categoryName: "Конденсаторы КМ" };
  assert.equal(usesGramQuantity(km), true);
  assert.equal(computeLineTotal(113400, 1000, km), 113400);
  assert.equal(usesGramQuantity({ unitType: "GRAM", categorySlug: "platinovaya-gruppa" }), true);
});

test("without unitType the section name still decides (legacy fallback)", () => {
  assert.equal(usesGramQuantity({ categorySlug: "kondensatory-km" }), true);
  assert.equal(usesGramQuantity({ categorySlug: "rezistory" }), false);
});
