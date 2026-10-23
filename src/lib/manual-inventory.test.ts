import test from "node:test";
import assert from "node:assert/strict";
import { manualInventoryTotal, restoreManualInventory, validateManualInventoryInput, type ManualInventoryInput } from "./manual-inventory";

const line: ManualInventoryInput = { name: "Деталь вне каталога", year: "1988", unit: "PIECE", condition: "used", quantity: 3, unitPrice: 12.34 };

test("manual totals preserve kopecks and use the selected unit without catalog discounts", () => {
  assert.equal(manualInventoryTotal(line), 37.02);
  assert.equal(manualInventoryTotal({ ...line, unit: "KG", quantity: 0.125, unitPrice: 2000 }), 250);
  assert.equal(manualInventoryTotal({ ...line, unit: "GRAM", quantity: 125, unitPrice: 2 }), 250);
  assert.equal(manualInventoryTotal({ ...line, unit: "GRAM", quantity: 0.125, unitPrice: 2 }), 0.25);
  assert.equal(manualInventoryTotal({ ...line, unitPrice: 0 }), 0);
});

test("manual input rejects invalid amounts and fractional pieces", () => {
  assert.equal(validateManualInventoryInput(line).success, true);
  assert.equal(validateManualInventoryInput({ ...line, unit: "KG", quantity: 0.125 }).success, true);
  for (const change of [{name:" "},{quantity:0},{quantity:-1},{quantity:1.5},{quantity:NaN},{unitPrice:Infinity},{unitPrice:-1},{unitPrice:1.234},{unit:["PIECE"]},{condition:["used"]},{unit:"litre"}]) {
    assert.equal(validateManualInventoryInput({ ...line, ...change }).success, false, JSON.stringify(change));
  }
});

test("restoring saved manual positions keeps valid rows and drops corrupt or duplicate records", () => {
  const records = [{ ...line, id: "a" },{ ...line, id: "a" },{ ...line, id: "b", quantity:-1 },null,{ ...line, id: "c", name: "  Ещё деталь  " }];
  const restored = restoreManualInventory(JSON.parse(JSON.stringify(records)));
  assert.deepEqual(restored.map((r) => r.id), ["a","c"]);
  assert.equal(restored[1].name, "Ещё деталь");
  assert.equal(restored[0].unitPrice, 12.34);
  assert.deepEqual(restoreManualInventory({lines:records}), []);
});
