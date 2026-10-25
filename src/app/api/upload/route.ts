import { NextResponse } from "next/server";
import path from "path";
import { isAuthenticated } from "@/app/actions/auth";
import { saveWatermarkedPhoto } from "@/lib/catalog-photo-storage";
import { PhotoProcessingError } from "@/lib/catalog-photo-watermark";

// Разрешённые типы файлов
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export async function POST(request: Request) {
  try {
    // Проверяем авторизацию
    if (!(await isAuthenticated())) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!(file instanceof File)) {
      return NextResponse.json(
        { success: false, error: "Файл не предоставлен" },
        { status: 400 }
      );
    }

    // Проверяем тип файла
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Недопустимый тип файла. Разрешены: JPG, PNG, WebP, GIF" },
        { status: 400 }
      );
    }

    // Проверяем размер файла
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: "Файл слишком большой. Максимум 5MB" },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const bytes = await file.arrayBuffer();
    const purpose = formData.get("purpose");
    const prepared = formData.get("prepared");
    if (purpose !== null && purpose !== "catalog" && purpose !== "store") {
      return NextResponse.json({ success: false, error: "Неизвестный раздел загрузки" }, { status: 400 });
    }
    if (prepared !== null && prepared !== "" && prepared !== "client") {
      return NextResponse.json({ success: false, error: "Неизвестный режим обработки" }, { status: 400 });
    }
    // A browser-framed card is already centred on white. Watermark it, but do not crop it again.
    const photoPurpose = prepared === "client" ? "client-framed" : purpose === "store" ? "store" : "catalog";
    const fileName = await saveWatermarkedPhoto(Buffer.from(bytes), uploadsDir, photoPurpose);

    // Возвращаем публичный URL
    const publicUrl = `/uploads/${fileName}`;

    return NextResponse.json({
      success: true,
      url: publicUrl,
      fileName: fileName,
    });
  } catch (error) {
    if (error instanceof PhotoProcessingError) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400 });
    }
    console.error("Ошибка загрузки файла:", error);
    return NextResponse.json(
      { success: false, error: "Ошибка при загрузке файла" },
      { status: 500 }
    );
  }
}
