import { isAuthenticated } from "@/app/actions";
import { CartPageClient } from "./CartPageClient";
import { prisma } from "@/lib/prisma";

export default async function CartPage() {
  const [isAdmin, catalogCategories] = await Promise.all([
    isAuthenticated(),
    prisma.category.findMany({
      select: { id: true, parentId: true, sortOrder: true, childSortOrder: true },
      orderBy: { sortOrder: "asc" },
    }),
  ]);
  return <CartPageClient isAdmin={isAdmin} catalogCategories={catalogCategories} />;
}
