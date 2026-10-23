export interface InventoryCatalogCategory {
  id: string;
  parentId: string | null;
  sortOrder: number;
  childSortOrder: number;
}

interface CatalogProductOrder {
  categoryId: string;
  sortOrder: number;
}

/** Match the public catalog: root category, its child/own-product slot, product. */
export function sortInventoryByCatalog<T>(
  rows: readonly T[],
  categories: readonly InventoryCatalogCategory[],
  getProduct: (row: T) => CatalogProductOrder | null,
): T[] {
  const byId = new Map(categories.map((category) => [category.id, category]));
  const roots = categories.filter((category) => !category.parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder);
  const rootRanks = new Map(roots.map((category, index) => [category.id, index]));

  function key(product: CatalogProductOrder | null): number[] {
    if (!product) return [Number.MAX_SAFE_INTEGER];
    const category = byId.get(product.categoryId);
    if (!category) return [Number.MAX_SAFE_INTEGER];

    let root = category;
    let branch = category;
    const visited = new Set<string>();
    while (root.parentId) {
      if (visited.has(root.id)) return [Number.MAX_SAFE_INTEGER];
      visited.add(root.id);
      const parent = byId.get(root.parentId);
      if (!parent) return [Number.MAX_SAFE_INTEGER];
      branch = root;
      root = parent;
    }

    return [
      rootRanks.get(root.id) ?? Number.MAX_SAFE_INTEGER,
      category.id === root.id ? root.childSortOrder : branch.sortOrder,
      product.sortOrder,
    ];
  }

  return rows.map((row, index) => ({ row, index, key: key(getProduct(row)) }))
    .sort((a, b) => {
      for (let i = 0; i < Math.max(a.key.length, b.key.length); i++) {
        const difference = (a.key[i] ?? 0) - (b.key[i] ?? 0);
        if (difference) return difference;
      }
      // Keep different years/conditions of the same product in their added order.
      return a.index - b.index;
    })
    .map(({ row }) => row);
}
