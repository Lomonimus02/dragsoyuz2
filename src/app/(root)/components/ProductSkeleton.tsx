export function ProductSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-[var(--gray-200)] overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-square bg-[var(--gray-200)]" />

      {/* Content skeleton */}
      <div className="p-4">
        {/* Title */}
        <div className="h-5 bg-[var(--gray-200)] rounded w-3/4 mb-2" />
        <div className="h-5 bg-[var(--gray-200)] rounded w-1/2 mb-3" />

        {/* Marking */}
        <div className="h-4 bg-[var(--gray-200)] rounded w-1/3 mb-4" />

        {/* Price */}
        <div className="flex items-end justify-between">
          <div>
            <div className="h-3 bg-[var(--gray-200)] rounded w-16 mb-2" />
            <div className="h-6 bg-[var(--gray-200)] rounded w-24" />
          </div>
          <div className="h-4 bg-[var(--gray-200)] rounded w-20" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}
