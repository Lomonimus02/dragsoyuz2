import test from "node:test";
import assert from "node:assert/strict";
import type { ProductWithPrice } from "@/app/actions/products";
import { catalogPurchaseCopy, productCatalogPath, productCatalogSchema, categoryPreparation } from "./catalog-content";
import { purchaseCopyDefaults } from "./product-purchase-copy";

const sample = { name: "КМ H90", categoryName: "Конденсаторы КМ", categorySlug: "kondensatory-km", slug: "km-h90", unitType: "KG", isSingleType: true, isNewAvailable: true, isUsedAvailable: false, isPriceOnRequest: false, hasModifications: false, image: null } as ProductWithPrice;
test("single-price weight position does not imply new-only acceptance or a one-piece minimum", () => {
  const copy = catalogPurchaseCopy(sample, "РадиоКлад", purchaseCopyDefaults(sample.categoryName, sample.categorySlug));
  assert.match(copy.introduction, /за 1 кг/);
  assert.match(copy.acceptance, /единая цена/);
  assert.doesNotMatch(JSON.stringify(copy), /в любом|от 1 штуки|гарантия|б\/у и новые/);
});
test("used-only and price-on-request positions follow their data", () => {
  const copy = catalogPurchaseCopy({...sample, isSingleType: false, isNewAvailable: false, isUsedAvailable: true, isPriceOnRequest: true, unitType:"PIECE"}, "РадиоКлад");
  assert.match(copy.acceptance, /цена для б\/у/);
  assert.match(copy.metaDescription, /по запросу/);
  assert.doesNotMatch(copy.metaDescription, /цены скупки за/);
});
test("current category name wins over a repurposed tantal slug", () => {
  assert.doesNotMatch(categoryPreparation("Корпуса часов").identify, /конденсатор|фольг/);
  assert.match(categoryPreparation("Тантал").identify, /фольг/);
  assert.doesNotMatch(categoryPreparation("Конденсаторы серебро").identify, /контакты/);
  assert.match(categoryPreparation("Конденсаторы по танталу").identify, /конденсатора/);
});
test("schema never manufactures a retail offer, even with missing variant base prices", () => {
  const p = {...sample,hasModifications:true,priceNew:null,priceUsed:null};
  const schema=productCatalogSchema(p,"https://radio-klad.ru","Скупка КМ");
  assert.equal(schema.url,"https://radio-klad.ru/catalog/kondensatory-km/km-h90");
  assert.equal(schema["@type"],"WebPage");
  assert.doesNotMatch(JSON.stringify(schema), /Offer|InStock|priceCurrency|"price"/);
});
test("canonical path uses the owning category and encodes path segments", () => {
  assert.equal(productCatalogPath({...sample,slug:"КМ/№1"}),"/catalog/kondensatory-km/%D0%9A%D0%9C%2F%E2%84%961");
});
test("genuinely edited category copy remains editable", () => {
  const copy=catalogPurchaseCopy(sample,"РадиоКлад",{introduction:"Оценка {название} по маркировке"});
  assert.equal(copy.introduction,"Оценка КМ H90 по маркировке");
});
