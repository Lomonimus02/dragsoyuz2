import { serveCatalogPhoto } from "@/lib/stored-catalog-photo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  return serveCatalogPhoto(request, new URL(request.url).searchParams.get("file") ?? "");
}
