import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL as BASE_URL } from "@/lib/site";

// Генерация sitemap происходит динамически (при запросе), т.к. требуется доступ к БД
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Статические страницы
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${BASE_URL}/catalog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/contacts`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/postal`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/how-to-sell`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  try {
    // Получаем категории напрямую из Prisma для доступа к updatedAt
    const categories = await prisma.category.findMany({
      select: {
        slug: true,
        updatedAt: true,
        infoPageEnabled: true,
      },
    });

    const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
      url: `${BASE_URL}/catalog/${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

    // Получаем товары с их категориями
    const products = await prisma.product.findMany({
      select: {
        slug: true,
        updatedAt: true,
        category: {
          select: {
            slug: true,
          },
        },
      },
    });

    const productPages: MetadataRoute.Sitemap = products.map((product) => ({
      url: `${BASE_URL}/catalog/${product.category.slug}/${product.slug}`,
      lastModified: product.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

    const guidePages: MetadataRoute.Sitemap = categories
      .filter((category) => category.infoPageEnabled)
      .map((category) => ({
        url: `${BASE_URL}/catalog/${category.slug}/guide`,
        lastModified: category.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      }));

    const articles = await prisma.article.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
    });

    const articlePages: MetadataRoute.Sitemap = articles.map((article) => ({
      url: `${BASE_URL}/blog/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    return [...staticPages, ...categoryPages, ...productPages, ...guidePages, ...articlePages];
  } catch (error) {
    // Если БД недоступна, возвращаем только статические страницы
    console.error("Sitemap: Database unavailable, returning static pages only", error);
    return staticPages;
  }
}
