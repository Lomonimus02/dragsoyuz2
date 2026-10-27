import assert from "node:assert/strict";
import test from "node:test";
import {
  RADIOKLAD_METRIKA_ID,
  metrikaInlineScript,
  metrikaNoscriptSrc,
  resolvePublicMetrikaId,
} from "./yandex-metrika";

test("RadioKlad gets its own counter even when the DragSoyuz id is configured", () => {
  assert.equal(
    resolvePublicMetrikaId({
      theme: "radioklad",
      configuredId: "108599989",
    }),
    RADIOKLAD_METRIKA_ID,
  );
});

test("DragSoyuz keeps its configured counter and never receives the RadioKlad id", () => {
  assert.equal(
    resolvePublicMetrikaId({
      theme: "dragsoyuz",
      configuredId: "108599989",
    }),
    "108599989",
  );
  assert.equal(
    resolvePublicMetrikaId({
      theme: "dragsoyuz",
      configuredId: RADIOKLAD_METRIKA_ID,
    }),
    null,
  );
  assert.equal(resolvePublicMetrikaId({ theme: "dragsoyuz", configuredId: "" }), null);
  assert.equal(resolvePublicMetrikaId({ theme: "dragsoyuz", configuredId: "not-a-number" }), null);
});

test("local preview stays free of the counter", () => {
  assert.equal(
    resolvePublicMetrikaId({ theme: "radioklad", localPreview: true }),
    null,
  );
});

test("inline snippet matches the Metrika loader and noscript pixel", () => {
  const script = metrikaInlineScript(RADIOKLAD_METRIKA_ID);
  assert.match(script, /https:\/\/mc\.yandex\.ru\/metrika\/tag\.js\?id=113820841/);
  assert.match(script, /ym\(113820841, 'init'/);
  assert.match(script, /ssr:true/);
  assert.match(script, /webvisor:true/);
  assert.match(script, /clickmap:true/);
  assert.match(script, /ecommerce:"dataLayer"/);
  assert.match(script, /accurateTrackBounce:true/);
  assert.match(script, /trackLinks:true/);
  assert.equal(metrikaNoscriptSrc(RADIOKLAD_METRIKA_ID), "https://mc.yandex.ru/watch/113820841");
  assert.throws(() => metrikaInlineScript("113820841;alert(1)"));
});
