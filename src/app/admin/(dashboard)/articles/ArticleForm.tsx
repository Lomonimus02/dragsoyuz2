"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, ImagePlus, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import { createArticle, updateArticle, type ArticleFaqItem } from "@/app/actions";
import { ArticleBodyEditor } from "./ArticleBodyEditor";
import { siteHostLabel } from "@/lib/site";

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[а-яё]/g, (char) => {
      const map: Record<string, string> = {
        а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "yo", ж: "zh",
        з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
        п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
        ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
      };
      return map[char] || char;
    })
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export type ArticleFormValues = {
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

type ArticleFormProps = {
  mode: "create" | "edit";
  articleId?: string;
  initial?: ArticleFormValues;
};

const emptyValues: ArticleFormValues = {
  title: "",
  slug: "",
  excerpt: "",
  body: "",
  imageUrl: "",
  published: false,
  seoTitle: "",
  seoDescription: "",
  authorName: "",
  faq: [],
};

export function ArticleForm({ mode, articleId, initial }: ArticleFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<ArticleFormValues>(initial ?? emptyValues);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const setField = <K extends keyof ArticleFormValues>(key: K, value: ArticleFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleTitleChange = (title: string) => {
    setValues((prev) => ({
      ...prev,
      title,
      slug: slugTouched ? prev.slug : generateSlug(title),
    }));
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const result = await response.json();

      if (result.success && typeof result.url === "string") {
        setField("imageUrl", result.url);
        setSuccess("Изображение загружено");
      } else {
        setError(result.error || "Ошибка загрузки");
      }
    } catch {
      setError("Ошибка при загрузке файла");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const payload = {
        title: values.title,
        slug: values.slug,
        excerpt: values.excerpt,
        body: values.body,
        imageUrl: values.imageUrl,
        published: values.published,
        seoTitle: values.seoTitle,
        seoDescription: values.seoDescription,
        authorName: values.authorName,
        faq: values.faq,
      };

      const result =
        mode === "edit" && articleId
          ? await updateArticle(articleId, payload)
          : await createArticle(payload);

      if (result.success) {
        router.push("/admin/articles");
        router.refresh();
      } else {
        setError(result.error);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      {error && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-800">
          <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm">{success}</span>
        </div>
      )}

      <div className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <label htmlFor="article-title" className="mb-2 block text-sm font-medium text-slate-700">
            Название
          </label>
          <input
            id="article-title"
            value={values.title}
            onChange={(event) => handleTitleChange(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="article-seo-title" className="mb-2 block text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            id="article-seo-title"
            value={values.seoTitle}
            onChange={(event) => setField("seoTitle", event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            Заголовок во вкладке браузера и в поиске. Если пусто — берётся название статьи.
          </p>
        </div>

        <div>
          <label htmlFor="article-slug" className="mb-2 block text-sm font-medium text-slate-700">
            Ссылка на статью
          </label>
          <input
            id="article-slug"
            value={values.slug}
            onChange={(event) => {
              setSlugTouched(true);
              setField("slug", event.target.value);
            }}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
            placeholder="poleznaya-informatsiya"
          />
          <p className="mt-1 text-xs text-slate-500">
            Это не почтовый адрес. Статья откроется как {siteHostLabel()}/blog/
            {values.slug || "…"}. Латиница, цифры и дефисы, при создании
            подставляется из названия.
          </p>
        </div>

        <div>
          <label htmlFor="article-excerpt" className="mb-2 block text-sm font-medium text-slate-700">
            Краткое описание
          </label>
          <textarea
            id="article-excerpt"
            rows={3}
            value={values.excerpt}
            onChange={(event) => setField("excerpt", event.target.value)}
            className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="article-seo-description" className="mb-2 block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            id="article-seo-description"
            rows={3}
            value={values.seoDescription}
            onChange={(event) => setField("seoDescription", event.target.value)}
            className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            Краткое описание в поиске. Если пусто — берётся краткое описание.
          </p>
        </div>

        <div>
          <label htmlFor="article-author" className="mb-2 block text-sm font-medium text-slate-700">
            Автор
          </label>
          <input
            id="article-author"
            value={values.authorName}
            onChange={(event) => setField("authorName", event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
          />
          <p className="mt-1 text-xs text-slate-500">
            Необязательно. Если заполнено, на странице статьи будет строка «Автор: …».
          </p>
        </div>

        <ArticleBodyEditor
          id="article-body"
          label="Текст"
          value={values.body}
          onChange={(body) => setField("body", body)}
        />

        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-slate-700">Вопросы и ответы</p>
            <button
              type="button"
              onClick={() =>
                setField("faq", [...values.faq, { question: "", answer: "" }])
              }
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Plus className="h-4 w-4" />
              Добавить
            </button>
          </div>
          {values.faq.length === 0 ? (
            <p className="text-xs text-slate-500">
              Необязательно. Пустые пары при сохранении отбрасываются.
            </p>
          ) : (
            <div className="space-y-4">
              {values.faq.map((item, index) => (
                <div key={index} className="space-y-3 rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <label
                      htmlFor={`article-faq-q-${index}`}
                      className="block text-sm font-medium text-slate-700"
                    >
                      Вопрос
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setField(
                          "faq",
                          values.faq.filter((_, itemIndex) => itemIndex !== index),
                        )
                      }
                      className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                      title="Удалить"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    id={`article-faq-q-${index}`}
                    value={item.question}
                    onChange={(event) => {
                      const next = values.faq.slice();
                      next[index] = { ...item, question: event.target.value };
                      setField("faq", next);
                    }}
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                  />
                  <label
                    htmlFor={`article-faq-a-${index}`}
                    className="block text-sm font-medium text-slate-700"
                  >
                    Ответ
                  </label>
                  <textarea
                    id={`article-faq-a-${index}`}
                    rows={3}
                    value={item.answer}
                    onChange={(event) => {
                      const next = values.faq.slice();
                      next[index] = { ...item, answer: event.target.value };
                      setField("faq", next);
                    }}
                    className="w-full resize-y rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Изображение</p>
          {values.imageUrl ? (
            <div className="mb-3 overflow-hidden rounded-lg border border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={values.imageUrl} alt="" className="max-h-64 w-full object-contain" />
            </div>
          ) : null}
          <div className="flex items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              {isUploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ImagePlus className="h-4 w-4" />
              )}
              {isUploading ? "Загрузка..." : "Загрузить"}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="hidden"
              />
            </label>
            {values.imageUrl ? (
              <button
                type="button"
                onClick={() => setField("imageUrl", "")}
                className="rounded-lg p-2 text-red-500 hover:bg-red-50"
                title="Удалить изображение"
              >
                <X className="h-5 w-5" />
              </button>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-slate-500">JPG, PNG, WebP или GIF. Максимум 5 МБ.</p>
        </div>

        <label className="flex items-center gap-3 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            checked={values.published}
            onChange={(event) => setField("published", event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Опубликовать
        </label>
      </div>

      <button
        type="submit"
        disabled={isPending || isUploading}
        className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            Сохранение...
          </>
        ) : (
          <>
            <Save className="h-5 w-5" />
            Сохранить
          </>
        )}
      </button>
    </form>
  );
}
