import { readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { CATALOG_PHOTO_VERSION, isCatalogPhotoName } from "./catalog-photo-url";

/** Stored uploads are already framed and watermarked; never recomposite them. */
export async function serveCatalogPhoto(request: Request, name: string) {
  if (!isCatalogPhotoName(name)) return new Response("Not found", { status: 404 });
  try {
    const directory = await realpath(path.join(process.cwd(), "public/uploads"));
    const file = await realpath(path.join(directory, name));
    if (path.dirname(file) !== directory) return new Response("Not found", { status: 404 });
    const info = await stat(file);
    if (!info.isFile()) return new Response("Not found", { status: 404 });
    const contentType: Record<string, string> = { ".jpeg": "image/jpeg", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif" };
    const headers = {
      "Content-Type": contentType[path.extname(name).toLowerCase()],
      "Cache-Control": "public, max-age=86400",
      "X-Content-Type-Options": "nosniff",
      ETag: `"${CATALOG_PHOTO_VERSION}-${info.size}-${info.mtimeMs}"`,
    };
    if (request.headers.get("if-none-match") === headers.ETag) return new Response(null, { status: 304, headers });
    return new Response(new Uint8Array(await readFile(file)), { headers });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
