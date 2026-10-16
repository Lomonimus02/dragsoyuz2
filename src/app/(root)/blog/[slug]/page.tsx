import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { getPublishedArticleBySlug, type ArticleFaqItem } from "@/app/actions";
import { articlePlainText, parseArticleBody } from "@/lib/article-body";
import { ArticleBodyView } from "../../components/ArticleBodyView";
import { SITE_BRAND, SITE_URL as BASE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

function descriptionFromArticle(excerpt: string | null, body: string): string {
  const raw = (excerpt?.trim() || articlePlainText(body)).replace(/\s+/g, " ").trim();
  if (raw.length <= 160) return raw;
  return `${raw.slice(0, 160).trimEnd()}…`;
}

function articleDocumentTitle(article: { title: string; seoTitle: string }): string {
  const seoTitle = article.seoTitle.trim();
  return seoTitle || article.title;
}

function articleMetaDescription(article: {
  excerpt: string | null;
  body: string;
  seoDescription: string;
}): string {
  const seoDescription = article.seoDescription.trim();
  if (seoDescription) return seoDescription;
  return descriptionFromArticle(article.excerpt, article.body);
}

function absoluteUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${BASE_URL}${path}`;
}

function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

function formatArticleDate(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function ArticleJsonLd({
  headline,
  description,
  canonical,
  datePublished,
  dateModified,
  imageUrl,
  authorName,
  faq,
}: {
  headline: string;
  description: string;
  canonical: string;
  datePublished: Date;
  dateModified: Date;
  imageUrl: string | null;
  authorName: string;
  faq: ArticleFaqItem[];
}) {
  const author = authorName.trim();
  const posting: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline,
    description,
    datePublished: datePublished.toISOString(),
    dateModified: dateModified.toISOString(),
    mainEntityOfPage: canonical,
    publisher: {
      "@type": "Organization",
      name: SITE_BRAND,
    },
  };

  if (imageUrl) {
    posting.image = absoluteUrl(imageUrl);
  }
  if (author) {
    posting.author = {
      "@type": "Person",
      name: author,
    };
  }

  const faqSchema =
    faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faq.map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.answer,
            },
          })),
        }
      : null;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(posting) }} />
      {faqSchema ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(faqSchema) }} />
      ) : null}
    </>
  );
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) {
    return { title: "Статья не найдена" };
  }

  const title = articleDocumentTitle(article);
  const description = articleMetaDescription(article);
  const canonical = `${BASE_URL}/blog/${article.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonical,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getPublishedArticleBySlug(slug);
  if (!article) notFound();

  const blocks = parseArticleBody(article.body);
  const lead = article.excerpt?.trim() ?? "";
  const author = article.authorName.trim();
  const description = articleMetaDescription(article);
  const canonical = `${BASE_URL}/blog/${article.slug}`;

  return (
    <div className="min-h-screen bg-[var(--gray-50)]">
      <ArticleJsonLd
        headline={article.title}
        description={description}
        canonical={canonical}
        datePublished={article.createdAt}
        dateModified={article.updatedAt}
        imageUrl={article.imageUrl}
        authorName={author}
        faq={article.faq}
      />
      <div className="border-b border-[var(--gray-200)] bg-white">
        <div className="container mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 overflow-x-auto text-sm text-[var(--gray-500)]">
            <Link href="/" className="whitespace-nowrap hover:text-[var(--primary-600)]">
              Главная
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0" />
            <Link href="/blog" className="whitespace-nowrap hover:text-[var(--primary-600)]">
              Полезная информация
            </Link>
            <ChevronRight className="h-4 w-4 shrink-0" />
            <span className="truncate font-medium text-[var(--gray-900)]">{article.title}</span>
          </nav>
        </div>
      </div>

      <article className="container mx-auto max-w-3xl px-4 py-8 md:py-12">
        <p className="text-sm font-medium uppercase tracking-wide text-[var(--primary-700)]">
          Статья
        </p>
        <h1 className="mt-3 text-3xl font-bold leading-tight text-[var(--gray-900)] md:text-4xl">
          {article.title}
        </h1>
        <time
          dateTime={article.createdAt.toISOString()}
          className="mt-4 block text-sm text-[var(--gray-500)]"
        >
          {formatArticleDate(article.createdAt)}
        </time>
        {author ? <p className="mt-1 text-sm text-[var(--gray-500)]">Автор: {author}</p> : null}

        {lead ? (
          <p className="mt-6 border-l-4 border-[var(--accent-400)] pl-4 text-lg leading-relaxed text-[var(--gray-700)]">
            {lead}
          </p>
        ) : null}

        {article.imageUrl ? (
          <figure className="mt-8 overflow-hidden rounded-2xl bg-[var(--gray-100)]">
            <Image
              src={article.imageUrl}
              alt=""
              width={1200}
              height={675}
              priority
              className="h-auto w-full object-cover"
            />
          </figure>
        ) : null}

        <div className="mt-8">
          <ArticleBodyView blocks={blocks} />
        </div>

        {article.faq.length > 0 ? (
          <section className="mt-12 border-t border-[var(--gray-200)] pt-8">
            <h2 className="text-2xl font-bold text-[var(--gray-900)]">Вопросы и ответы</h2>
            <div className="mt-6 space-y-6">
              {article.faq.map((item, index) => (
                <div key={index}>
                  <h3 className="text-lg font-semibold leading-snug text-[var(--gray-900)]">
                    {item.question}
                  </h3>
                  <p className="mt-2 whitespace-pre-wrap text-[17px] leading-8 text-[var(--gray-800)]">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <div className="mt-12 border-t border-[var(--gray-200)] pt-6">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 font-medium text-[var(--primary-700)] hover:text-[var(--primary-900)]"
          >
            <ArrowLeft className="h-4 w-4" />
            Все статьи
          </Link>
        </div>
      </article>
    </div>
  );
}
