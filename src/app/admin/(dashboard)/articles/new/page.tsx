import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ArticleForm } from "../ArticleForm";

export const dynamic = "force-dynamic";

export default function NewArticlePage() {
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
        <h1 className="text-2xl font-bold text-slate-900">Новая статья</h1>
      </div>
      <ArticleForm mode="create" />
    </div>
  );
}
