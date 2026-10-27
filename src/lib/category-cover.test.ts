import assert from "node:assert/strict";
import test from "node:test";
import {
  categoryCoverImages,
  usableCatalogImage,
  type CategoryCoverNode,
  type CategoryCoverProduct,
} from "./category-cover";

const nodes: CategoryCoverNode[] = [
  { id: "caps", parentId: null },
  { id: "caps-km", parentId: "caps" },
  { id: "caps-km-green", parentId: "caps-km" },
  { id: "diodes", parentId: null },
  { id: "chips", parentId: null },
];

const product = (
  id: string,
  categoryId: string,
  image: string | null,
  isShowcaseFace = false,
  sortOrder = 0,
): CategoryCoverProduct => ({ id, categoryId, image, isShowcaseFace, sortOrder });

test("uses a homepage product photo from a nested subcategory", () => {
  const covers = categoryCoverImages(
    ["caps"],
    nodes,
    [
      product("plain", "caps", "/uploads/root.webp", false, 1),
      product("face", "caps-km-green", "/uploads/km.webp", true, 9),
    ],
  );
  assert.equal(covers.get("caps"), "/uploads/km.webp");
});

test("falls back to any nested photo when the homepage product has none", () => {
  const covers = categoryCoverImages(
    ["caps"],
    nodes,
    [
      product("face", "caps-km", null, true, 0),
      product("blank", "caps-km", "   ", false, 1),
      product("later", "caps-km-green", "/uploads/later.webp", false, 4),
      product("earlier", "caps", "/uploads/earlier.webp", false, 2),
    ],
  );
  assert.equal(covers.get("caps"), "/uploads/earlier.webp");
});

test("uses any direct product photo when nothing is flagged for the homepage", () => {
  const covers = categoryCoverImages(
    ["diodes"],
    nodes,
    [
      product("b", "diodes", "/uploads/b.webp", false, 2),
      product("a", "diodes", "/uploads/a.webp", false, 2),
    ],
  );
  assert.equal(covers.get("diodes"), "/uploads/a.webp");
});

test("leaves a category without photos empty and does not borrow from another root", () => {
  const covers = categoryCoverImages(
    ["caps", "diodes"],
    nodes,
    [product("chip", "chips", "/uploads/chip.webp", true, 0)],
  );
  assert.equal(covers.has("caps"), false);
  assert.equal(covers.has("diodes"), false);
});

test("stops on a parent cycle", () => {
  const covers = categoryCoverImages(
    ["a"],
    [
      { id: "a", parentId: "b" },
      { id: "b", parentId: "a" },
    ],
    [product("photo", "b", "/uploads/b.webp")],
  );
  assert.equal(covers.get("a"), "/uploads/b.webp");
});

test("ignores a blank category image", () => {
  assert.equal(usableCatalogImage("  "), null);
  assert.equal(usableCatalogImage(null), null);
  assert.equal(usableCatalogImage("/uploads/own.webp"), "/uploads/own.webp");
});
