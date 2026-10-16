import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublishedArticles } from "@/app/actions";
import { articlePlainText } from "@/lib/article-body";
import { SITE_URL as BASE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
const PAGE_SIZE = 10;

interface BlogPageProps {
  searchParams: Promise<{ page?: string }>;
}

function parsePage(raw: string | undefined): number | null {
  if (raw === undefined) return 1;
  if (!/^\d+$/.test(raw)) return null;
  const page = Number(raw);
  if (page < 1) return null;
  return page;
}

function previewText(excerpt: string | null, body: string): string {
  const raw = (excerpt?.trim() || articlePlainText(body)).replace(/\s+/g, " ").trim();
  if (raw.length <= 160) return raw;
  return `${raw.slice(0, 160).trimEnd()}…`;
}

export async function generateMetadata({ searchParams }: BlogPageProps): Promise<Metadata> {
  const { page: pageRaw } = await searchParams;
  const page = parsePage(pageRaw) ?? 1;
  const canonical = page <= 1 ? `${BASE_URL}/blog` : `${BASE_URL}/blog?page=${page}`;

  return {
    title: page > 1 ? `Полезная информация — страница ${page}` : "Полезная информация",
    description:
      "Полезные статьи о радиодеталях и сдаче компонентов с драгоценными металлами.",
    alternates: {
      canonical,
    },
  };
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { page: pageRaw } = await searchParams;
  const page = parsePage(pageRaw);
  if (page === null) notFound();

  const result = await getPublishedArticles({ page, pageSize: PAGE_SIZE });
  if (page > result.pageCount) notFound();

  return (
    <div className="min-h-screen bg-[var(--gray-50)]">
      <div className="bg-[var(--primary-900)] py-8 text-white md:py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl font-bold md:text-3xl lg:text-4xl">Полезная информация</h1>
          <p className="mt-2 text-white/70">Статьи о радиодеталях и сдаче</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {result.items.length === 0 ? (
          <p className="text-[var(--gray-600)]">Статей пока нет</p>
        ) : (
          <div className="flex flex-col gap-4 md:gap-6">
            {result.items.map((article) => {
              const preview = previewText(article.excerpt, article.body);
              return (
                <Link
                  key={article.id}
                  href={`/blog/${article.slug}`}
                  className="flex flex-col overflow-hidden rounded-xl border border-[var(--gray-200)] bg-white transition-all duration-300 hover:border-[var(--accent-400)] hover:shadow-lg sm:flex-row"
                >
                  {article.imageUrl ? (
                    <div className="relative h-48 w-full shrink-0 bg-[var(--gray-100)] sm:h-40 sm:w-44 md:w-52">
                      <Image
                        src={article.imageUrl}
                        alt={article.title}
                        fill
                        className="object-cover"
                        sizes="(min-width: 640px) 208px, 100vw"
                      />
                    </div>
                  ) : null}
                  <div className="flex flex-1 flex-col justify-center p-5">
                    <h2 className="text-lg font-semibold text-[var(--gray-900)]">{article.title}</h2>
                    {preview ? (
                      <p className="mt-2 text-sm leading-relaxed text-[var(--gray-600)]">{preview}</p>
                    ) : null}
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {result.pageCount > 1 ? (
          <nav className="mt-8 flex flex-wrap justify-center gap-2" aria-label="Страницы">
            {Array.from({ length: result.pageCount }, (_, index) => index + 1).map((number) => {
              const href = number === 1 ? "/blog" : `/blog?page=${number}`;
              const current = number === result.page;
              return (
                <Link
                  key={number}
                  href={href}
                  aria-current={current ? "page" : undefined}
                  className={
                    current
                      ? "flex h-11 min-w-11 items-center justify-center rounded-lg bg-[var(--primary-900)] px-3 font-semibold text-white"
                      : "flex h-11 min-w-11 items-center justify-center rounded-lg border border-[var(--gray-200)] bg-white px-3 text-[var(--gray-700)] hover:border-[var(--accent-400)]"
                  }
                >
                  {number}
                </Link>
              );
            })}
          </nav>
        ) : null}
      </div>
    </div>
  );
}
