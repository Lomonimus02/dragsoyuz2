import assert from "node:assert/strict";
import test from "node:test";
import { productPurchaseCopy, parsePurchaseCopySettings } from "./product-purchase-copy";

const product = { name: "КТ 201, 203 (белые ноги)", categoryName: "Транзисторы", categorySlug: "tranzistory" };

test("year deductions apply to exactly the four requested product groups", () => {
  for (const categorySlug of ["tranzistory", "mikroshemy", "raz-emy", "razemy", "diody"]) {
    const copy = productPurchaseCopy({ ...product, categoryName: "", categorySlug }, "РадиоКлад");
    assert.equal(copy.hasYearAdjustment, true, categorySlug);
    for (const year of ["1990", "2000", "2010"]) assert.ok(copy.acceptance.includes(year));
    for (const discount of ["10%", "20%", "40%"]) assert.ok(copy.acceptance.includes(discount));
  }
});

test("capacitor subgroups, silver and all other current groups omit the entire year clause", () => {
  for (const categorySlug of ["kondensatory", "kondensatory-km", "kondensatory-serebro", "kondensatory-po-pd", "kondensatory-po-tantalu", "tehnicheskoe-serebro", "rezistory", "rele", "platinovaya-gruppa", "pereklyuchateli", "potentsiometry", "protsessory-i-platy", "tantal", "akkumulyatory", "lampy", "future-category"]) {
    const copy = productPurchaseCopy({ name: "Деталь 1990", categoryName: "Другая группа", categorySlug }, "РадиоКлад");
    assert.equal(copy.hasYearAdjustment, false, categorySlug);
    assert.ok(copy.acceptance.endsWith("(Деталь 1990) б/у и новые."));
    assert.doesNotMatch(copy.schemaDescription, /цена зависит|минус|\d+%/);
  }
});

test("a renamed category URL still recognizes its name, including ё", () => {
  const copy = productPurchaseCopy({ ...product, categoryName: " Разъёмы ", categorySlug: "connectors" }, "РадиоКлад");
  assert.equal(copy.hasYearAdjustment, true);
});

test("new or renamed products get copy from their current name without saved SEO fields", () => {
  const name = " Новая деталь <тип A> & B ";
  const copy = productPurchaseCopy({ ...product, name }, "РадиоКлад");
  for (const value of [copy.title, copy.introduction, copy.acceptance, copy.benefitsHeading, copy.conclusion, copy.metaDescription, copy.schemaDescription]) {
    assert.ok(value.includes(name.trim()));
    assert.doesNotMatch(value, /НАЗВАНИЕ_ДЕТАЛИ|КТ 201/);
  }
});


test("group grammar and parentheses are consistent through all sections", () => {
  const copy = productPurchaseCopy({ name: "130,133", categoryName: "Микросхемы", categorySlug: "mikroshemy" }, "РадиоКлад");
  assert.match(copy.title, /^Скупка микросхем \(130,133\)/);
  assert.match(copy.acceptance, /^Мы принимаем микросхемы \(130,133\)/);
});

test("current category names win over old slugs", () => {
  const cases = [["Корпуса часов", "tantal", "корпусов часов"], ["Тантал", "akkumulyatory", "тантала"]];
  for (const [categoryName, categorySlug, group] of cases) {
    const copy = productPurchaseCopy({ name: "Образец", categoryName, categorySlug }, "РадиоКлад");
    assert.ok(copy.title.startsWith(`Скупка ${group} (Образец)`));
  }
});

test("saved category copy changes text without hardcoding a product or brand", () => {
  const settings = { groupGenitive: "деталей", introduction: "{бренд}: принимаем {название}", benefits: "Первое\n\nВторое" };
  const copy = productPurchaseCopy(product, "РадиоКлад", settings);
  assert.ok(copy.title.startsWith("Скупка деталей (КТ 201"));
  assert.equal(copy.introduction, "РадиоКлад: принимаем КТ 201, 203 (белые ноги)");
  assert.deepEqual(copy.benefits, ["Первое", "Второе"]);
  assert.deepEqual(parsePurchaseCopySettings({ title: 7, unknown: "no", groupGenitive: " x " }), { groupGenitive: "x" });
});
