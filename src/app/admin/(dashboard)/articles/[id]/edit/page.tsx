import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { adminGetArticleById } from "@/app/actions";
import { ArticleForm } from "../../ArticleForm";

export const dynamic = "force-dynamic";

interface EditArticlePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditArticlePage({ params }: EditArticlePageProps) {
  const { id } = await params;
  const result = await adminGetArticleById(id);

  if (!result.success) {
    if (result.error === "Статья не найдена") notFound();
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {result.error}
      </div>
    );
  }

  const article = result.data;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/admin/articles"
          className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
          К списку статей
        </Link>
        <h1 className="text-2xl font-bold text-slate-900">Редактирование статьи</h1>
      </div>
      <ArticleForm
        mode="edit"
        articleId={article.id}
        initial={{
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt ?? "",
          body: article.body,
          imageUrl: article.imageUrl ?? "",
          published: article.published,
          seoTitle: article.seoTitle,
          seoDescription: article.seoDescription,
          authorName: article.authorName,
          faq: article.faq,
        }}
      />
    </div>
  );
}
