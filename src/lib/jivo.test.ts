import assert from "node:assert/strict";
import test from "node:test";
import { RADIOKLAD_JIVO_WIDGET_ID, resolveJivoWidgetId } from "./jivo";

test("RadioKlad Jivo id comes from the env var and falls back to the production widget", () => {
  assert.equal(resolveJivoWidgetId("  customId  ", "radioklad"), "customId");
  assert.equal(resolveJivoWidgetId("", "radioklad"), RADIOKLAD_JIVO_WIDGET_ID);
  assert.equal(resolveJivoWidgetId(undefined, "radioklad"), "aXuLlAFWY4");
  assert.equal(resolveJivoWidgetId(undefined, "dragsoyuz"), "");
  assert.equal(resolveJivoWidgetId("mL1h2xDSrD", "dragsoyuz"), "mL1h2xDSrD");
});
