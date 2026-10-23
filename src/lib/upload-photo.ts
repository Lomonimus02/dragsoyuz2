"use client";

type UploadOptions = { purpose?: "catalog" | "store"; signal?: AbortSignal; onStatus?: (text: string) => void };
const MAX_SOURCE_BYTES = 30 * 1024 * 1024;

function decodePhoto(blob: Blob, signal: AbortSignal): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const url = URL.createObjectURL(blob);
    const image = new Image();
    const finish = (error?: unknown) => {
      URL.revokeObjectURL(url);
      signal.removeEventListener("abort", abort);
      image.onload = image.onerror = null;
      if (error) reject(error); else resolve(image);
    };
    const abort = () => { image.src = ""; finish(signal.reason); };
    signal.addEventListener("abort", abort, { once: true });
    image.onload = () => finish();
    image.onerror = () => finish(new Error("Не удалось прочитать фотографию. Попробуйте другой файл."));
    image.src = url;
  });
}

async function preparePhoto(file: File, signal: AbortSignal): Promise<Blob> {
  if (file.size > MAX_SOURCE_BYTES) throw new Error("Фотография слишком большая. Выберите файл до 30 МБ.");
  const heic = /\.(heic|heif)$/i.test(file.name) || /image\/hei[cf]/i.test(file.type);
  if (!heic && !/^image\/(jpeg|png|webp|gif)$/.test(file.type) && !/\.(jpe?g|png|webp|gif)$/i.test(file.name)) {
    throw new Error("Выберите фотографию JPG, PNG, WebP, GIF или HEIC.");
  }
  // Let the server validate GIF animation instead of silently flattening it.
  if (file.type === "image/gif" || /\.gif$/i.test(file.name)) return file;
  let image: HTMLImageElement;
  try { image = await decodePhoto(file, signal); }
  catch (error) {
    signal.throwIfAborted();
    if (!heic) throw error;
    const { heicTo } = await import("heic-to/csp");
    const converted = await heicTo({ blob: file, type: "image/jpeg", quality: 0.95 });
    image = await decodePhoto(converted, signal);
  }
  signal.throwIfAborted();
  const scale = Math.min(1, 2000 / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Не удалось подготовить фотографию. Перезагрузите страницу и повторите попытку.");
  context.fillStyle = "#fff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  try {
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(
      blob => blob ? resolve(blob) : reject(new Error("Не удалось подготовить фотографию.")), "image/jpeg", 0.94,
    ));
  } finally { canvas.width = canvas.height = 1; }
}

/** Originals stay in the browser; only a bounded upload is sent for watermarking. */
export async function uploadPhoto(file: File, options: UploadOptions = {}): Promise<string> {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => { timedOut = true; controller.abort(); }, 90_000);
  const abort = () => controller.abort();
  options.signal?.addEventListener("abort", abort, { once: true });
  if (options.signal?.aborted) controller.abort();
  const signal = controller.signal;
  try {
    return await Promise.race([
      (async () => {
        options.onStatus?.("Подготовка фотографии…");
        const photo = await preparePhoto(file, signal);
        signal.throwIfAborted();
        if (photo.size > 5 * 1024 * 1024) throw new Error("Файл остаётся слишком большим. Выберите фотографию меньшего размера.");
        const body = new FormData();
        body.append("file", photo, photo.type === "image/gif" ? "photo.gif" : "photo.jpg");
        body.append("purpose", options.purpose ?? "catalog");
        options.onStatus?.("Загрузка и нанесение водяного знака…");
        const response = await fetch("/api/upload", { method: "POST", body, signal, credentials: "same-origin" });
        const result = await response.json().catch(() => null);
        if (response.status === 401) throw new Error("Сеанс закончился. Войдите в админку заново и повторите загрузку.");
        if (response.status === 413) throw new Error("Сервер отклонил размер фотографии. Выберите файл меньшего размера.");
        if (!response.ok || !result?.success || typeof result.url !== "string") {
          throw new Error(result?.error || "Сервер не смог загрузить фото. Повторите попытку.");
        }
        return result.url as string;
      })(),
      new Promise<never>((_, reject) => {
        if (signal.aborted) reject(signal.reason);
        else signal.addEventListener("abort", () => reject(signal.reason), { once: true });
      }),
    ]);
  } catch (error) {
    if (signal.aborted) throw new Error(timedOut ? "Загрузка заняла слишком много времени. Проверьте связь и попробуйте снова." : "Загрузка отменена. Можно выбрать фото заново.");
    if (error instanceof TypeError) throw new Error("Не удалось связаться с сервером. Проверьте интернет и повторите загрузку.");
    throw error;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", abort);
  }
}
