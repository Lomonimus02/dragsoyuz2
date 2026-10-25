"use client";

import { analyzeAlphaSubject, placeAlphaCutout } from "./catalog-photo-framing";
import { catalogWatermarkSvg } from "./catalog-watermark-svg";

/** Quantized ISNet (~42 MB) plus the ONNX wasm (~11 MB), cached by the browser. */
export const PRODUCT_BACKGROUND_MODEL_URL =
  "https://staticimgly.com/@imgly/background-removal-data/1.7.0/dist/";

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob | null> {
  return new Promise(resolve => canvas.toBlob(blob => resolve(blob), type, quality));
}

function loadSvg(svg: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    const image = new Image();
    const finish = (error?: Error) => {
      URL.revokeObjectURL(url);
      image.onload = image.onerror = null;
      if (error) reject(error);
      else resolve(image);
    };
    image.onload = () => finish();
    image.onerror = () => finish(new Error("Не удалось нанести водяной знак."));
    image.src = url;
  });
}

export async function removeProductBackground(
  blob: Blob,
  onProgress?: (message: string) => void,
  signal?: AbortSignal,
): Promise<Blob> {
  signal?.throwIfAborted();
  onProgress?.("Скачивание модели удаления фона… При первом запуске браузер сохранит её у себя.");
  let removeBackground: (image: Blob, config?: object) => Promise<Blob>;
  try {
    ({ removeBackground } = await import("@imgly/background-removal"));
  } catch {
    throw new Error("Не удалось загрузить удаление фона в браузере.");
  }
  signal?.throwIfAborted();
  const cutout = await removeBackground(blob, {
    publicPath: PRODUCT_BACKGROUND_MODEL_URL,
    model: "isnet_quint8",
    device: "cpu",
    output: { format: "image/png", quality: 0.9 },
    progress: (key: string, current: number, total: number) => {
      if (signal?.aborted) return;
      const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
      onProgress?.(key.startsWith("fetch:")
        ? `Скачивание модели (${pct}%). Браузер сохранит её и в следующий раз откроет сразу.`
        : `Удаление фона… ${pct}%`);
    },
  });
  signal?.throwIfAborted();
  return cutout;
}

/** Centre the cut-out on a white square, add a soft shadow, and preview the same watermark the server will store. */
export async function composeCatalogCard(cutout: Blob): Promise<{ previewUrl: string; upload: Blob }> {
  const bitmap = await createImageBitmap(cutout);
  const analysisCanvas = document.createElement("canvas");
  try {
    analysisCanvas.width = bitmap.width;
    analysisCanvas.height = bitmap.height;
    const analysisContext = analysisCanvas.getContext("2d", { willReadFrequently: true });
    if (!analysisContext) throw new Error("Не удалось собрать карточку фото.");
    analysisContext.drawImage(bitmap, 0, 0);
    const pixels = analysisContext.getImageData(0, 0, bitmap.width, bitmap.height).data;
    const subject = analyzeAlphaSubject(pixels, bitmap.width, bitmap.height);
    if (!subject || subject.transparentRatio < 0.05) throw new Error("Фон не отделился от детали.");
    const place = placeAlphaCutout(subject);
    const card = document.createElement("canvas");
    card.width = place.side;
    card.height = place.side;
    const context = card.getContext("2d");
    if (!context) throw new Error("Не удалось собрать карточку фото.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, place.side, place.side);
    context.shadowColor = "rgba(40, 40, 40, 0.28)";
    context.shadowBlur = Math.max(2, place.side * 0.028);
    context.shadowOffsetY = Math.max(1, place.side * 0.012);
    const scale = place.sw > 0 ? place.dw / place.sw : 1;
    context.drawImage(bitmap, place.dx - place.sx * scale, place.dy - place.sy * scale, bitmap.width * scale, bitmap.height * scale);
    context.shadowColor = "transparent";
    context.shadowBlur = 0;
    context.shadowOffsetY = 0;
    const upload = await canvasBlob(card, "image/png");
    if (!upload) throw new Error("Не удалось собрать карточку фото.");
    const mark = await loadSvg(catalogWatermarkSvg(place.side, place.side));
    context.drawImage(mark, 0, 0, place.side, place.side);
    const preview = await canvasBlob(card, "image/webp", 0.9) ?? await canvasBlob(card, "image/png");
    if (!preview) throw new Error("Не удалось показать предпросмотр.");
    card.width = card.height = 1;
    return { previewUrl: URL.createObjectURL(preview), upload };
  } finally {
    analysisCanvas.width = analysisCanvas.height = 1;
    bitmap.close();
  }
}
