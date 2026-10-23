/** Refuse to use any other database while running the local preview. */
export function assertLocalPreviewDatabase(connectionString: string | undefined) {
  let url: URL;
  try {
    url = new URL(connectionString ?? "");
  } catch {
    throw new Error("Local preview requires a valid local DATABASE_URL.");
  }

  if (
    !["postgres:", "postgresql:"].includes(url.protocol) ||
    url.hostname !== "127.0.0.1" ||
    url.port !== "5478" ||
    url.pathname !== "/dragsoyuz2" ||
    [...url.searchParams].some(([key, value]) => key !== "schema" || value !== "public")
  ) {
    throw new Error("Local preview only permits dragsoyuz2 at 127.0.0.1:5478.");
  }
}
