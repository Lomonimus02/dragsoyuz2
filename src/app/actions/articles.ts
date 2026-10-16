"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAuthenticated } from "./auth";

const PAGE_SIZE_DEFAULT = 10;

export type ArticleFaqItem = {
  question: string;
  answer: string;
};

export type ArticleListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  imageUrl: string | null;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
  authorName: string;
  faq: ArticleFaqItem[];
  createdAt: Date;
  updatedAt: Date;
};

export type PublishedArticlesPage = {
  items: ArticleListItem[];
  total: number;
  page: number;
  pageCount: number;
};

export type ArticleInput = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  imageUrl: string;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
  authorName: string;
  faq: ArticleFaqItem[];
};

function normalizeArticleFaq(value: unknown): ArticleFaqItem[] {
  if (!Array.isArray(value)) return [];
  const items: ArticleFaqItem[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const record = entry as { question?: unknown; answer?: unknown };
    const question = typeof record.question === "string" ? record.question.trim() : "";
    const answer = typeof record.answer === "string" ? record.answer.trim() : "";
    if (!question || !answer) continue;
    items.push({ question, answer });
  }
  return items;
}

function mapArticle(article: {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  imageUrl: string | null;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
  authorName: string;
  faq: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
}): ArticleListItem {
  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt,
    body: article.body,
    imageUrl: article.imageUrl,
    published: article.published,
    seoTitle: article.seoTitle ?? "",
    seoDescription: article.seoDescription ?? "",
    authorName: article.authorName ?? "",
    faq: normalizeArticleFaq(article.faq),
    createdAt: article.createdAt,
    updatedAt: article.updatedAt,
  };
}

export type ArticleResult =
  | { success: true; data: ArticleListItem }
  | { success: false; error: string };

export type ArticlesAdminResult =
  | { success: true; data: ArticleListItem[] }
  | { success: false; error: string };

export type DeleteArticleResult =
  | { success: true }
  | { success: false; error: string };

function revalidateArticlePaths(slug?: string) {
  revalidatePath("/blog");
  revalidatePath("/sitemap.xml");
  if (slug) {
    revalidatePath(`/blog/${slug}`);
  }
}

function normalizeSlug(raw: string): string {
  return raw.trim().toLowerCase();
}

function isSlugFormatValid(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

async function slugTaken(slug: string, excludeId?: string): Promise<boolean> {
  const existing = await prisma.article.findUnique({ where: { slug } });
  if (!existing) return false;
  return existing.id !== excludeId;
}

function isUniqueError(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

function toNullable(value: string): string | null {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

/**
 * Опубликованные статьи, новые сверху. page — 1-based.
 */
export async function getPublishedArticles(input: {
  page: number;
  pageSize?: number;
}): Promise<PublishedArticlesPage> {
  const pageSize = input.pageSize ?? PAGE_SIZE_DEFAULT;
  const page = input.page;
  const where = { published: true };
  const total = await prisma.article.count({ where });
  const pageCount = total === 0 ? 1 : Math.ceil(total / pageSize);
  const rows = await prisma.article.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * pageSize,
    take: pageSize,
  });

  return { items: rows.map(mapArticle), total, page, pageCount };
}

export async function getPublishedArticleBySlug(
  slug: string,
): Promise<ArticleListItem | null> {
  const article = await prisma.article.findFirst({
    where: { slug, published: true },
  });
  return article ? mapArticle(article) : null;
}

export async function adminListArticles(): Promise<ArticlesAdminResult> {
  try {
    if (!(await isAuthenticated())) {
      return { success: false, error: "Не авторизован" };
    }

    const rows = await prisma.article.findMany({
      orderBy: { createdAt: "desc" },
    });

    return { success: true, data: rows.map(mapArticle) };
  } catch (error) {
    console.error("Ошибка при загрузке статей:", error);
    return { success: false, error: "Не удалось загрузить статьи" };
  }
}

export async function adminGetArticleById(id: string): Promise<ArticleResult> {
  try {
    if (!(await isAuthenticated())) {
      return { success: false, error: "Не авторизован" };
    }

    const data = await prisma.article.findUnique({ where: { id } });
    if (!data) {
      return { success: false, error: "Статья не найдена" };
    }

    return { success: true, data: mapArticle(data) };
  } catch (error) {
    console.error("Ошибка при загрузке статьи:", error);
    return { success: false, error: "Не удалось загрузить статью" };
  }
}

function validateArticleInput(input: ArticleInput): {
  error?: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  imageUrl: string | null;
  published: boolean;
  seoTitle: string;
  seoDescription: string;
  authorName: string;
  faq: ArticleFaqItem[];
} {
  const title = input.title.trim();
  const slug = normalizeSlug(input.slug);
  const body = input.body.trim();
  const seoTitle = (input.seoTitle ?? "").trim();
  const seoDescription = (input.seoDescription ?? "").trim();
  const authorName = (input.authorName ?? "").trim();
  const faq = normalizeArticleFaq(input.faq);

  if (!title) {
    return {
      error: "Укажите название статьи",
      title,
      slug,
      excerpt: null,
      body,
      imageUrl: null,
      published: input.published,
      seoTitle,
      seoDescription,
      authorName,
      faq,
    };
  }

  if (!slug) {
    return {
      error: "Укажите адрес статьи",
      title,
      slug,
      excerpt: null,
      body,
      imageUrl: null,
      published: input.published,
      seoTitle,
      seoDescription,
      authorName,
      faq,
    };
  }

  if (!isSlugFormatValid(slug)) {
    return {
      error: "Адрес может содержать только латинские буквы, цифры и дефисы",
      title,
      slug,
      excerpt: null,
      body,
      imageUrl: null,
      published: input.published,
      seoTitle,
      seoDescription,
      authorName,
      faq,
    };
  }

  return {
    title,
    slug,
    excerpt: toNullable(input.excerpt),
    body,
    imageUrl: toNullable(input.imageUrl),
    published: input.published,
    seoTitle,
    seoDescription,
    authorName,
    faq,
  };
}

export async function createArticle(input: ArticleInput): Promise<ArticleResult> {
  try {
    if (!(await isAuthenticated())) {
      return { success: false, error: "Не авторизован" };
    }

    const parsed = validateArticleInput(input);
    if (parsed.error) {
      return { success: false, error: parsed.error };
    }

    if (await slugTaken(parsed.slug)) {
      return { success: false, error: "Статья с таким адресом уже существует" };
    }

    const data = await prisma.article.create({
      data: {
        title: parsed.title,
        slug: parsed.slug,
        excerpt: parsed.excerpt,
        body: parsed.body,
        imageUrl: parsed.imageUrl,
        published: parsed.published,
        seoTitle: parsed.seoTitle,
        seoDescription: parsed.seoDescription,
        authorName: parsed.authorName,
        faq: parsed.faq,
      },
    });

    revalidateArticlePaths(data.slug);

    return { success: true, data: mapArticle(data) };
  } catch (error) {
    if (isUniqueError(error)) {
      return { success: false, error: "Статья с таким адресом уже существует" };
    }
    console.error("Ошибка при создании статьи:", error);
    return { success: false, error: "Не удалось сохранить статью" };
  }
}

export async function updateArticle(
  id: string,
  input: ArticleInput,
): Promise<ArticleResult> {
  try {
    if (!(await isAuthenticated())) {
      return { success: false, error: "Не авторизован" };
    }

    const current = await prisma.article.findUnique({ where: { id } });
    if (!current) {
      return { success: false, error: "Статья не найдена" };
    }

    const parsed = validateArticleInput(input);
    if (parsed.error) {
      return { success: false, error: parsed.error };
    }

    if (await slugTaken(parsed.slug, id)) {
      return { success: false, error: "Статья с таким адресом уже существует" };
    }

    const data = await prisma.article.update({
      where: { id },
      data: {
        title: parsed.title,
        slug: parsed.slug,
        excerpt: parsed.excerpt,
        body: parsed.body,
        imageUrl: parsed.imageUrl,
        published: parsed.published,
        seoTitle: parsed.seoTitle,
        seoDescription: parsed.seoDescription,
        authorName: parsed.authorName,
        faq: parsed.faq,
      },
    });

    revalidateArticlePaths(current.slug);
    if (current.slug !== data.slug) {
      revalidateArticlePaths(data.slug);
    }

    return { success: true, data: mapArticle(data) };
  } catch (error) {
    if (isUniqueError(error)) {
      return { success: false, error: "Статья с таким адресом уже существует" };
    }
    console.error("Ошибка при обновлении статьи:", error);
    return { success: false, error: "Не удалось сохранить статью" };
  }
}

export async function deleteArticle(id: string): Promise<DeleteArticleResult> {
  try {
    if (!(await isAuthenticated())) {
      return { success: false, error: "Не авторизован" };
    }

    const current = await prisma.article.findUnique({ where: { id } });
    if (!current) {
      return { success: false, error: "Статья не найдена" };
    }

    await prisma.article.delete({ where: { id } });
    revalidateArticlePaths(current.slug);

    return { success: true };
  } catch (error) {
    console.error("Ошибка при удалении статьи:", error);
    return { success: false, error: "Не удалось удалить статью" };
  }
}
