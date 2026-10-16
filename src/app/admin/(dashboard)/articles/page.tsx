import Link from "next/link";
import { BookOpen, Plus } from "lucide-react";
import { adminListArticles } from "@/app/actions";
import { DeleteArticleButton } from "./DeleteArticleButton";

export const dynamic = "force-dynamic";

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function AdminArticlesPage() {
  const result = await adminListArticles();
  const articles = result.success ? result.data : [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
            <BookOpen className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Полезная информация</h1>
          </div>
        </div>
        <Link
          href="/admin/articles/new"
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5" />
          Новая статья
        </Link>
      </div>

      {!result.success && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {result.error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {articles.length === 0 ? (
          <p className="px-6 py-10 text-center text-slate-500">Статей пока нет</p>
        ) : (
          <ul className="divide-y divide-slate-200">
            {articles.map((article) => (
              <li key={article.id} className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-slate-900">{article.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{formatDate(article.createdAt)}</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      article.published
                        ? "bg-green-50 text-green-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {article.published ? "Опубликовано" : "Черновик"}
                  </span>
                  <Link
                    href={`/admin/articles/${article.id}/edit`}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                  >
                    Править
                  </Link>
                  <DeleteArticleButton id={article.id} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
