import { getApprovedReviews } from "@/app/actions";
import { ReviewsCarousel } from "./ReviewsCarousel";

export async function ReviewsSection() {
  const result = await getApprovedReviews();

  if (!result.success || result.data.length === 0) {
    return null;
  }

  const reviews = result.data.map((review) => ({
    id: review.id,
    name: review.name,
    text: review.text,
  }));

  return (
    <section className="py-16 md:py-20 bg-gradient-to-b from-[var(--gray-50)] to-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-14">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[var(--gray-900)]">
            Отзывы наших клиентов
          </h2>
          <p className="text-[var(--gray-600)] mt-3 max-w-2xl mx-auto">
            Честная оценка, быстрая оплата и прозрачные условия — именно это
            отмечают наши клиенты
          </p>
        </div>

        <ReviewsCarousel reviews={reviews} />
      </div>
    </section>
  );
}
