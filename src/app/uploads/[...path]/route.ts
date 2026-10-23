import { serveCatalogPhoto } from "@/lib/stored-catalog-photo";

export async function GET(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  return serveCatalogPhoto(request, segments.join("/"));
}
