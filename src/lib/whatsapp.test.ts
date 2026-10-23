import assert from "node:assert/strict";
import test from "node:test";
import { formatWhatsAppHref, normalizeWhatsAppNumber } from "./whatsapp";

test("formatted and Russian domestic numbers open the same international chat", () => {
  for (const input of ["+7 (952) 282-83-83", "79522828383", "8 (952) 282-83-83"]) {
    assert.equal(normalizeWhatsAppNumber(input), "+79522828383");
    assert.equal(formatWhatsAppHref(input), "https://wa.me/79522828383");
  }
  assert.equal(formatWhatsAppHref("+44 7700 900123"), "https://wa.me/447700900123");
});

test("blank contacts disable WhatsApp and malformed values cannot become links", () => {
  for (const input of [undefined, null, "", "   "]) assert.equal(formatWhatsAppHref(input), "");
  for (const input of ["123", "+0123456789", "1234567890123456", "javascript:alert(1)", "https://wa.me/79522828383", "+7 952 abc 2828383"]) {
    assert.equal(normalizeWhatsAppNumber(input), null);
    assert.equal(formatWhatsAppHref(input), "");
  }
});
