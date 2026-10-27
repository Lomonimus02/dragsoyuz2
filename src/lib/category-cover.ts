export interface CategoryCoverNode {
  id: string;
  parentId: string | null;
}

export interface CategoryCoverProduct {
  id: string;
  categoryId: string;
  image: string | null;
  isShowcaseFace: boolean;
  sortOrder: number;
}

/** Root plus this many nested levels. Deeper rows are ignored so a parent cycle cannot walk forever. */
const MAX_CATEGORY_DEPTH = 8;

export function usableCatalogImage(image: string | null | undefined): string | null {
  const value = image?.trim() ?? "";
  return value.length > 0 ? value : null;
}

/**
 * One product photo per root category.
 * A product flagged for the homepage wins when it has a photo, including
 * when it sits in a nested category. Otherwise the first catalog photo in
 * that same tree is used. Own category.imageUrl is applied by the caller.
 */
export function categoryCoverImages(
  rootIds: readonly string[],
  nodes: readonly CategoryCoverNode[],
  products: readonly CategoryCoverProduct[],
): Map<string, string> {
  const children = new Map<string, string[]>();
  for (const node of nodes) {
    if (!node.parentId) continue;
    const list = children.get(node.parentId);
    if (list) list.push(node.id);
    else children.set(node.parentId, [node.id]);
  }

  const byCategory = new Map<string, CategoryCoverProduct[]>();
  for (const product of products) {
    if (!usableCatalogImage(product.image)) continue;
    const list = byCategory.get(product.categoryId);
    if (list) list.push(product);
    else byCategory.set(product.categoryId, [product]);
  }

  const covers = new Map<string, string>();
  for (const rootId of rootIds) {
    const image = coverForTree(rootId, children, byCategory);
    if (image) covers.set(rootId, image);
  }
  return covers;
}

function coverForTree(
  rootId: string,
  children: ReadonlyMap<string, readonly string[]>,
  byCategory: ReadonlyMap<string, readonly CategoryCoverProduct[]>,
): string | null {
  const seen = new Set<string>();
  const queue: Array<{ id: string; depth: number }> = [{ id: rootId, depth: 0 }];
  let face: CategoryCoverProduct | null = null;
  let any: CategoryCoverProduct | null = null;

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current.id)) continue;
    seen.add(current.id);

    for (const product of byCategory.get(current.id) ?? []) {
      if (product.isShowcaseFace && (!face || preferred(product, face))) face = product;
      if (!any || preferred(product, any)) any = product;
    }

    if (current.depth >= MAX_CATEGORY_DEPTH) continue;
    for (const childId of children.get(current.id) ?? []) {
      if (!seen.has(childId)) queue.push({ id: childId, depth: current.depth + 1 });
    }
  }

  return usableCatalogImage((face ?? any)?.image);
}

function preferred(candidate: CategoryCoverProduct, current: CategoryCoverProduct): boolean {
  if (candidate.sortOrder !== current.sortOrder) return candidate.sortOrder < current.sortOrder;
  return candidate.id < current.id;
}
