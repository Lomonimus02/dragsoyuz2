"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Loader2,
  Trash2,
  MessageSquare,
  Clock,
  CheckCircle2,
} from "lucide-react";
import {
  adminApproveReview,
  adminDeleteReview,
  type ReviewData,
} from "@/app/actions";

function formatReviewDate(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function ReviewCard({
  review,
  onApprove,
  onDelete,
  isPending,
  activeActionId,
}: {
  review: ReviewData;
  onApprove?: () => void;
  onDelete: () => void;
  isPending: boolean;
  activeActionId: string | null;
}) {
  const isThisReviewLoading = isPending && activeActionId === review.id;

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div>
          <p className="font-semibold text-slate-900">{review.name}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {formatReviewDate(review.createdAt)}
          </p>
        </div>
        {review.approved ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Опубликован
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
            <Clock className="w-3.5 h-3.5" />
            Ожидает
          </span>
        )}
      </div>

      <p className="text-slate-700 text-sm leading-relaxed whitespace-pre-wrap">
        {review.text}
      </p>

      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-100">
        {!review.approved && onApprove && (
          <button
            type="button"
            onClick={onApprove}
            disabled={isPending}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 rounded-lg transition-colors"
          >
            {isThisReviewLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Опубликовать
          </button>
        )}
        <button
          type="button"
          onClick={onDelete}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 rounded-lg transition-colors"
        >
          {isThisReviewLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Trash2 className="w-4 h-4" />
          )}
          Удалить
        </button>
      </div>
    </div>
  );
}

export function ReviewsModerationPanel({
  initialReviews,
}: {
  initialReviews: ReviewData[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeActionId, setActiveActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pendingReviews = initialReviews.filter((r) => !r.approved);
  const approvedReviews = initialReviews.filter((r) => r.approved);

  const handleApprove = (id: string) => {
    setError(null);
    setActiveActionId(id);
    startTransition(async () => {
      const result = await adminApproveReview(id);
      if (!result.success) {
        setError(result.error || "Не удалось опубликовать отзыв");
      }
      setActiveActionId(null);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Удалить этот отзыв?")) return;

    setError(null);
    setActiveActionId(id);
    startTransition(async () => {
      const result = await adminDeleteReview(id);
      if (!result.success) {
        setError(result.error || "Не удалось удалить отзыв");
      }
      setActiveActionId(null);
      router.refresh();
    });
  };

  return (
    <div className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <section>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-5 h-5 text-amber-600" />
          <h2 className="text-lg font-semibold text-slate-900">
            Ожидают проверки
          </h2>
          <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded-full">
            {pendingReviews.length}
          </span>
        </div>

        {pendingReviews.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            Нет отзывов на модерации
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {pendingReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onApprove={() => handleApprove(review.id)}
                onDelete={() => handleDelete(review.id)}
                isPending={isPending}
                activeActionId={activeActionId}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <h2 className="text-lg font-semibold text-slate-900">
            Опубликованные
          </h2>
          <span className="px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
            {approvedReviews.length}
          </span>
        </div>

        {approvedReviews.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
            Опубликованных отзывов пока нет
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {approvedReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onDelete={() => handleDelete(review.id)}
                isPending={isPending}
                activeActionId={activeActionId}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
