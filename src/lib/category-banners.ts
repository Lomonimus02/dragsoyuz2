import fs from "fs";
import path from "path";

const GUIDES_DIR = path.join(process.cwd(), "content", "category-guides");

/**
 * Баннер справочника — если для категории есть файл content/category-guides/{slug}.md
 */
export function showGuideBanner(slug: string): boolean {
  try {
    return fs.existsSync(path.join(GUIDES_DIR, `${slug}.md`));
  } catch {
    return false;
  }
}

export function getCategoryGuideContent(slug: string): string | null {
  try {
    const filePath = path.join(GUIDES_DIR, `${slug}.md`);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

/** Slug категорий, для которых есть файл справочника */
export function listCategoryGuideSlugs(): string[] {
  try {
    if (!fs.existsSync(GUIDES_DIR)) return [];
    return fs
      .readdirSync(GUIDES_DIR)
      .filter((file) => file.endsWith(".md"))
      .map((file) => file.replace(/\.md$/, ""));
  } catch {
    return [];
  }
}
