"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Search, Loader2, Package } from "lucide-react";
import { findBestMatchProduct, getProducts, ProductWithPrice } from "@/app/actions";

interface MobileSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

// Быстрые подсказки с маппингом на категории
const QUICK_SUGGESTIONS = [
  { label: "Конденсаторы КМ", slug: "kondensatory-km" },
  { label: "Транзисторы", slug: "tranzistory" },
  { label: "Микросхемы", slug: "mikroshemy" },
  { label: "Разъемы", slug: "razemy" },
  { label: "Реле", slug: "rele" },
  { label: "Резисторы", slug: "rezistory" },
];

export function MobileSearchOverlay({ isOpen, onClose }: MobileSearchOverlayProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ProductWithPrice[]>([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);

  // Focus input when overlay opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Block body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Live search results
  useEffect(() => {
    const searchProducts = async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setSearchResults([]);
        return;
      }

      setIsLoadingResults(true);
      try {
        const result = await getProducts({
          search: searchQuery.trim(),
          limit: 10,
        });
        if (result.success) {
          setSearchResults(result.data);
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoadingResults(false);
      }
    };

    const debounce = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);

    try {
      const result = await findBestMatchProduct(searchQuery.trim());

      if (result.success) {
        router.push(`/catalog/${result.categorySlug}?highlight=${result.productSlug}`);
      } else {
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    } catch (error) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } finally {
      handleClose();
    }
  };

  const handleSuggestionClick = (slug: string) => {
    router.push(`/catalog/${slug}`);
    handleClose();
  };

  const handleProductClick = (product: ProductWithPrice) => {
    router.push(`/catalog/${product.categorySlug}?highlight=${product.slug}`);
    handleClose();
  };

  const handleClose = () => {
    setSearchQuery("");
    setSearchResults([]);
    setIsSearching(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-white animate-fadeIn">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-[var(--gray-200)] bg-white">
        <button
          onClick={handleClose}
          className="w-10 h-10 flex items-center justify-center hover:bg-[var(--gray-100)] rounded-lg transition-colors"
          aria-label="Закрыть"
        >
          <ArrowLeft className="w-6 h-6 text-[var(--gray-700)]" />
        </button>

        <form onSubmit={handleSearch} className="flex-1">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск по маркировке..."
              className="w-full h-12 pl-4 pr-12 rounded-xl bg-[var(--gray-100)] border border-[var(--gray-200)] text-[var(--gray-900)] placeholder:text-[var(--gray-400)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-500)] focus:border-transparent"
            />
            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-[var(--gray-200)] rounded-lg disabled:opacity-50 text-[var(--gray-600)] transition-colors"
            >
              {isSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto h-[calc(100vh-80px)]">
        {!searchQuery.trim() ? (
          /* Popular Searches */
          <div className="p-4">
            <h3 className="text-sm font-semibold text-[var(--gray-500)] uppercase tracking-wide mb-4">
              Популярные категории
            </h3>
            <div className="flex flex-wrap gap-2">
              {QUICK_SUGGESTIONS.map((suggestion) => (
                <button
                  key={suggestion.slug}
                  onClick={() => handleSuggestionClick(suggestion.slug)}
                  className="px-4 py-2 bg-[var(--gray-100)] hover:bg-[var(--gray-200)] text-[var(--gray-700)] rounded-full text-sm font-medium transition-colors"
                >
                  {suggestion.label}
                </button>
              ))}
            </div>
          </div>
        ) : isLoadingResults ? (
          /* Loading */
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--primary-500)]" />
          </div>
        ) : searchResults.length > 0 ? (
          /* Search Results List */
          <div className="divide-y divide-[var(--gray-100)]">
            {searchResults.map((product) => (
              <button
                key={product.id}
                onClick={() => handleProductClick(product)}
                className="w-full flex items-center gap-4 p-4 hover:bg-[var(--gray-50)] transition-colors text-left"
              >
                {/* Product Image */}
                <div className="w-16 h-16 bg-[var(--gray-100)] rounded-lg flex-shrink-0 overflow-hidden">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-[var(--gray-400)]" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-[var(--gray-900)] truncate">
                    {product.name}
                  </h4>
                  <p className="text-sm text-[var(--gray-500)] truncate">
                    {product.matchedModificationName 
                      ? <span>→ <span className="text-[var(--primary-600)] font-medium">{product.matchedModificationName}</span></span>
                      : product.categoryName
                    }
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {product.priceNew && (
                      <span className="text-sm font-semibold text-[var(--primary-600)]">
                        {product.priceNew.toLocaleString("ru-RU")} ₽
                      </span>
                    )}
                    {product.priceUsed && product.priceNew && (
                      <span className="text-xs text-[var(--gray-400)]">•</span>
                    )}
                    {product.priceUsed && (
                      <span className="text-sm text-[var(--gray-500)]">
                        б/у {product.priceUsed.toLocaleString("ru-RU")} ₽
                      </span>
                    )}
                  </div>
                </div>

                <Search className="w-5 h-5 text-[var(--gray-400)] flex-shrink-0" />
              </button>
            ))}
          </div>
        ) : searchQuery.length >= 2 ? (
          /* No Results */
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-[var(--gray-300)] mx-auto mb-3" />
            <p className="text-[var(--gray-600)] font-medium">Ничего не найдено</p>
            <p className="text-sm text-[var(--gray-400)] mt-1">
              Попробуйте изменить запрос
            </p>
          </div>
        ) : null}
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}
