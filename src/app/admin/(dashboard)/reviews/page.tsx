import { MessageSquare } from "lucide-react";
import { adminGetReviews } from "@/app/actions";
import { ReviewsModerationPanel } from "./ReviewsModerationPanel";

export const dynamic = "force-dynamic";

export default async function AdminReviewsPage() {
  const result = await adminGetReviews();
  const reviews = result.success ? result.data : [];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-indigo-100 flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Отзывы</h1>
          <p className="text-slate-500 text-sm">
            Модерация отзывов клиентов перед публикацией на главной
          </p>
        </div>
      </div>

      {!result.success && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {result.error}
        </div>
      )}

      <ReviewsModerationPanel initialReviews={reviews} />
    </div>
  );
}
