import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, ArrowLeft, BookOpen } from "lucide-react";
import { getCategoryBySlug } from "@/app/actions";
import { CategoryInfoBlocks } from "@/app/(root)/components/CategoryInfoBlocks";
import { parseInfoPageBlocks, resolveInfoButtonLabel } from "@/lib/category-info";
import { SITE_URL as BASE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

interface GuidePageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: GuidePageProps): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCategoryBySlug(slug);

  if (!result.success || !result.data.infoPageEnabled) {
    notFound();
  }

  const title = resolveInfoButtonLabel(
    result.data.infoPageButtonLabel,
    result.data.name,
  );
  const canonicalUrl = `${BASE_URL}/catalog/${slug}/guide`;

  return {
    title,
    description: `${title} — скупка радиодеталей в Санкт-Петербурге.`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description: `${title} — скупка радиодеталей в Санкт-Петербурге.`,
      type: "website",
      url: canonicalUrl,
    },
  };
}

export default async function CategoryGuidePage({ params }: GuidePageProps) {
  const { slug } = await params;

  const categoryResult = await getCategoryBySlug(slug);
  if (!categoryResult.success) {
    notFound();
  }

  const category = categoryResult.data;

  if (!category.infoPageEnabled) {
    notFound();
  }

  const pageTitle = resolveInfoButtonLabel(
    category.infoPageButtonLabel,
    category.name,
  );
  const blocks = parseInfoPageBlocks(category.infoPageBlocks);

  return (
    <div className="min-h-screen bg-[var(--gray-50)]">
      <div className="bg-white border-b border-[var(--gray-200)]">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-[var(--gray-500)] overflow-x-auto">
            <Link href="/" className="hover:text-[var(--primary-600)] whitespace-nowrap">
              Главная
            </Link>
            <ChevronRight className="w-4 h-4 shrink-0" />
            <Link href="/catalog" className="hover:text-[var(--primary-600)] whitespace-nowrap">
              Каталог
            </Link>
            <ChevronRight className="w-4 h-4 shrink-0" />
            <Link
              href={`/catalog/${slug}`}
              className="hover:text-[var(--primary-600)] whitespace-nowrap"
            >
              {category.name}
            </Link>
            <ChevronRight className="w-4 h-4 shrink-0" />
            <span className="text-[var(--gray-900)] font-medium whitespace-nowrap">
              {pageTitle}
            </span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        <Link
          href={`/catalog/${slug}`}
          className="inline-flex items-center gap-2 text-[var(--primary-600)] hover:text-[var(--primary-700)] mb-6 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад в «{category.name}»
        </Link>

        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-[var(--gray-200)] shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-[var(--accent-100)] flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[var(--accent-600)]" />
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--gray-900)]">
              {pageTitle}
            </h1>
          </div>

          <CategoryInfoBlocks blocks={blocks} />
        </div>
      </div>
    </div>
  );
}
