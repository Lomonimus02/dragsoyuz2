import { isAuthenticated } from "@/app/actions";
import { CartPageClient } from "./CartPageClient";

export default async function CartPage() {
  const isAdmin = await isAuthenticated();
  return <CartPageClient isAdmin={isAdmin} />;
}
