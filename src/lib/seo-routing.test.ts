import assert from "node:assert/strict";
import test from "node:test";
import { canonicalPageUrl, isPublicPageRequest, normalizePublicPath, productCatalogPath } from "./seo-routing";
import { productSeoCopy, seoPageCopy } from "./seo-content";

test("public paths converge without redirecting the already canonical URL", () => {
  for (const input of ["/catalog/", "/catalog//", "//catalog", "//catalog///"]) {
    const normalized = normalizePublicPath(input);
    assert.equal(normalized, "/catalog");
    assert.equal(normalizePublicPath(normalized), normalized);
  }
  assert.equal(normalizePublicPath("//"), "/");
  assert.equal(canonicalPageUrl("/catalog/?utm_source=test#item", "https://radio-klad.ru"), "https://radio-klad.ru/catalog");
  assert.equal(canonicalPageUrl("/?utm_source=test", "https://radio-klad.ru"), "https://radio-klad.ru");
});

test("SEO redirects leave actions, admin, APIs and resources alone", () => {
  for (const method of ["POST", "PUT", "DELETE", "OPTIONS"]) assert.equal(isPublicPageRequest(method, "/catalog/"), false);
  for (const path of ["/admin", "/admin/login/", "/api/upload", "/uploads/file.jpeg", "/_next/data/test", "/.well-known/acme-challenge/code", "/sitemap.xml"]) {
    assert.equal(isPublicPageRequest("GET", path), false);
  }
  assert.equal(isPublicPageRequest("HEAD", "/catalog/rele"), true);
});

test("product routes use real category and encode path segments", () => {
  assert.equal(productCatalogPath({ categorySlug: "kondensatory-serebro", slug: "eto-1" }), "/catalog/kondensatory-serebro/eto-1");
  assert.equal(productCatalogPath({ categorySlug: "a/b", slug: "c?d" }), "/catalog/a%2Fb/c%3Fd");
});

test("title, visible heading and description stay independently editable", () => {
  const copy = productSeoCopy({ name: "КМ", seoTitle: "Custom title", seoH1: "Custom H1", seoDescription: "Custom description" }, "РадиоКлад");
  assert.deepEqual(copy, { title: "Custom title", h1: "Custom H1", description: "Custom description" });
  const fallback = productSeoCopy({ name: "КМ" }, "РадиоКлад");
  assert.notEqual(fallback.title, fallback.h1);
  assert.doesNotMatch(fallback.description, /921|632-01-05/);
  assert.equal(seoPageCopy("/catalog/tantal").h1, "Скупка корпусов часов в Санкт-Петербурге");
});
