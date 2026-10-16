"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Search, Menu, X, Zap, Package, Phone, MapPin, Loader2, ChevronRight, Home, Mail, ClipboardList, BookOpen } from "lucide-react";
import { findBestMatchProduct, getProducts, ProductWithPrice } from "@/app/actions";
import { MobileSearchOverlay } from "./MobileSearchOverlay";
import { SITE_BRAND } from "@/lib/site";

// Тип контактных данных для Header
export interface HeaderContactInfo {
  phoneNumber: string;
  phoneHref: string;
  telegramHref: string;
  vkHref: string;
  workSchedule: string;
}

// Дефолтные значения на случай если данные не загружены
const DEFAULT_CONTACTS: HeaderContactInfo = {
  phoneNumber: "+7 (812) 983-49-76",
  phoneHref: "tel:+78129834976",
  telegramHref: "https://t.me/dragsoyuz",
  vkHref: "https://vk.com/dragsoyuz",
  workSchedule: "Ежедневно с 10:00 до 20:00",
};

// Custom Telegram icon component
function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
  );
}

const POPULAR_SEARCHES = [
  "Конденсаторы КМ",
  "Транзисторы",
  "Микросхемы",
  "Разъемы",
  "Реле",
  "Резисторы",
];

interface HeaderProps {
  contactInfo?: HeaderContactInfo;
}

export function Header({ contactInfo }: HeaderProps) {
  const contacts = contactInfo || DEFAULT_CONTACTS;
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [desktopSearchResults, setDesktopSearchResults] = useState<ProductWithPrice[]>([]);
  const [isLoadingDesktopResults, setIsLoadingDesktopResults] = useState(false);

  // Блокируем скролл body когда меню открыто
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Live search for desktop
  useEffect(() => {
    const searchProducts = async () => {
      if (!searchQuery.trim() || searchQuery.length < 2) {
        setDesktopSearchResults([]);
        return;
      }

      setIsLoadingDesktopResults(true);
      try {
        const result = await getProducts({
          search: searchQuery.trim(),
          limit: 8,
        });
        if (result.success) {
          setDesktopSearchResults(result.data);
        }
      } catch (error) {
        console.error("Desktop search error:", error);
      } finally {
        setIsLoadingDesktopResults(false);
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
      // Try to find the best matching product
      const result = await findBestMatchProduct(searchQuery.trim());
      
      if (result.success) {
        // Redirect to category page with highlight parameter
        router.push(`/catalog/${result.categorySlug}?highlight=${result.productSlug}`);
      } else {
        // Fallback to search page if no product found
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    } catch (error) {
      // Fallback to search page on error
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } finally {
      setSearchQuery("");
      setMobileMenuOpen(false);
      setIsSearching(false);
    }
  };

  const closeMenu = () => setMobileMenuOpen(false);

  const menuItems = [
    { href: "/", label: "Главная", icon: Home },
    { href: "/catalog", label: "Каталог", icon: Package },
    { href: "/postal", label: "Почтовые отправления", icon: Mail },
    { href: "/contacts", label: "Контакты", icon: MapPin },
    { href: "/how-to-sell", label: "Как сдать", icon: ClipboardList },
    { href: "/blog", label: "Полезная информация", icon: BookOpen },
    { href: "/about", label: "О нас", icon: Zap },
  ];

  return (
    <>
      <header className="bg-[var(--primary-900)] text-white shadow-lg relative z-50">
        <div className="container mx-auto px-4">
          {/* Main header row */}
          <div className="flex items-center justify-between h-16 lg:h-20 gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center lg:hidden">
                <Home className="w-6 h-6 text-white" />
              </div>
              <span className="hidden lg:block font-bold text-xl bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent">
                {SITE_BRAND}
              </span>
            </Link>

            {/* Search bar - desktop */}
            <form
              onSubmit={handleSearch}
              className="hidden md:flex flex-1 min-w-0 max-w-2xl mx-4"
            >
              <div className="relative w-full group">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsSearchFocused(true)}
                  onBlur={(e) => {
                    // Не закрываем если клик был внутри dropdown
                    if (e.relatedTarget?.closest('.suggestions-dropdown')) {
                      return;
                    }
                    setTimeout(() => setIsSearchFocused(false), 150);
                  }}
                  placeholder="Поиск по маркировке или названию..."
                  className="w-full h-12 pl-5 pr-12 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-[var(--accent-500)] focus:bg-white/15"
                />
                <button
                  type="submit"
                  disabled={isSearching}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-white/10 rounded-md transition-colors disabled:opacity-50"
                >
                  {isSearching ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Search className="w-5 h-5" />
                  )}
                </button>
                
                {/* Proactive Suggestions Dropdown */}
                {isSearchFocused && !searchQuery.trim() && (
                  <div 
                    className="suggestions-dropdown absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-[var(--gray-200)] overflow-hidden z-[999]"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <div className="p-3 border-b border-[var(--gray-100)]">
                      <p className="text-xs font-semibold text-[var(--gray-500)] uppercase tracking-wide">Популярные запросы</p>
                    </div>
                    <div className="p-2">
                      {POPULAR_SEARCHES.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => {
                            setSearchQuery(term);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2 text-[var(--gray-700)] hover:bg-[var(--gray-50)] rounded-md transition-colors text-left"
                        >
                          <Search className="w-4 h-4 text-[var(--gray-400)]" />
                          <span>{term}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Search Results Dropdown */}
                {isSearchFocused && searchQuery.trim().length >= 2 && (
                  <div 
                    className="suggestions-dropdown absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-[var(--gray-200)] overflow-hidden z-[999] max-h-[400px] overflow-y-auto"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {isLoadingDesktopResults ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-[var(--primary-500)]" />
                      </div>
                    ) : desktopSearchResults.length > 0 ? (
                      <div className="divide-y divide-[var(--gray-100)]">
                        {desktopSearchResults.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            onClick={() => {
                              router.push(`/catalog/${product.categorySlug}?highlight=${product.slug}`);
                              setSearchQuery("");
                              setIsSearchFocused(false);
                            }}
                            className="w-full flex items-center gap-3 p-3 hover:bg-[var(--gray-50)] transition-colors text-left"
                          >
                            <div className="w-10 h-10 bg-[var(--gray-100)] rounded-lg flex-shrink-0 overflow-hidden">
                              {product.image ? (
                                <img
                                  src={product.image}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-4 h-4 text-[var(--gray-400)]" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-[var(--gray-900)] truncate">{product.name}</p>
                              <p className="text-xs text-[var(--gray-500)]">
                                {product.matchedModificationName 
                                  ? <span>→ <span className="text-[var(--primary-600)] font-medium">{product.matchedModificationName}</span></span>
                                  : product.categoryName
                                }
                              </p>
                            </div>
                            {product.priceNew && (
                              <span className="text-sm font-semibold text-[var(--primary-600)] whitespace-nowrap">
                                {product.priceNew.toLocaleString("ru-RU")} ₽
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <Package className="w-8 h-8 text-[var(--gray-300)] mx-auto mb-2" />
                        <p className="text-sm text-[var(--gray-500)]">Ничего не найдено</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </form>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex shrink-0 items-center gap-3">
              <Link
                href="/catalog"
                className="flex items-center gap-2 whitespace-nowrap hover:text-[var(--accent-400)] transition-colors"
              >
                <Package className="w-5 h-5" />
                Каталог
              </Link>
              <Link
                href="/postal"
                className="flex items-center gap-2 whitespace-nowrap hover:text-[var(--accent-400)] transition-colors"
              >
                <Mail className="w-5 h-5" />
                Почтовые отправления
              </Link>
              <Link
                href="/how-to-sell"
                className="flex items-center gap-2 whitespace-nowrap hover:text-[var(--accent-400)] transition-colors"
              >
                <ClipboardList className="w-5 h-5" />
                Как сдать
              </Link>
              <Link
                href="/about"
                className="flex items-center gap-2 whitespace-nowrap hover:text-[var(--accent-400)] transition-colors"
              >
                <Zap className="w-5 h-5" />
                О нас
              </Link>
              <Link
                href="/blog"
                className="flex items-center gap-2 whitespace-nowrap hover:text-[var(--accent-400)] transition-colors"
              >
                <BookOpen className="w-5 h-5" />
                Полезная информация
              </Link>
              <Link
                href="/contacts"
                className="flex items-center gap-2 whitespace-nowrap hover:text-[var(--accent-400)] transition-colors"
              >
                <MapPin className="w-5 h-5" />
                Контакты
              </Link>
              <div className="flex items-center gap-2">
                <a
                  href={contacts.phoneHref}
                  className="flex items-center justify-center w-9 h-9 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Позвонить"
                >
                  <Phone className="w-5 h-5 text-[var(--accent-400)]" />
                </a>
                <a
                  href={contacts.telegramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-9 h-9 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  aria-label="Telegram"
                >
                  <TelegramIcon className="w-5 h-5 text-[var(--accent-400)]" />
                </a>
                {contacts.vkHref && (
                  <a
                    href={contacts.vkHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-9 h-9 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                    aria-label="ВКонтакте"
                  >
                    <svg className="w-5 h-5 text-[var(--accent-400)]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.27-1.422 2.18-3.61 2.18-3.61.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/>
                    </svg>
                  </a>
                )}
                <a
                  href={contacts.phoneHref}
                  className="text-lg font-bold text-[var(--accent-400)] hover:text-[var(--accent-300)] transition-colors"
                >
                  {contacts.phoneNumber}
                </a>
              </div>
            </nav>

            {/* Mobile: Phone + Search + Menu button */}
            <div className="flex items-center lg:hidden">
              {/* Center: Phone icons and number */}
              <div className="flex items-center gap-1 flex-1 justify-center min-w-0">
                {contacts.vkHref && (
                  <a
                    href={contacts.vkHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-9 h-9 shrink-0 hover:bg-white/10 rounded-lg transition-colors"
                    aria-label="ВКонтакте"
                  >
                    <svg className="w-5 h-5 text-[var(--accent-400)]" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.27-1.422 2.18-3.61 2.18-3.61.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/>
                    </svg>
                  </a>
                )}
                <a
                  href={contacts.telegramHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-9 h-9 shrink-0 hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Telegram"
                >
                  <TelegramIcon className="w-5 h-5 text-[var(--accent-400)]" />
                </a>
                <a
                  href={contacts.phoneHref}
                  className="text-sm sm:text-base font-bold text-[var(--accent-400)] hover:text-[var(--accent-300)] transition-colors whitespace-nowrap truncate"
                >
                  {contacts.phoneNumber}
                </a>
              </div>
              {/* Right: Search and Menu */}
              <div className="flex items-center shrink-0">
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Поиск"
                >
                  <Search className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="relative w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors"
                  aria-label="Меню"
                >
                  <span className={`absolute w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${mobileMenuOpen ? 'rotate-45' : '-translate-y-1.5'}`} />
                  <span className={`absolute w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 scale-0' : 'opacity-100'}`} />
                  <span className={`absolute w-5 h-0.5 bg-white rounded-full transition-all duration-300 ${mobileMenuOpen ? '-rotate-45' : 'translate-y-1.5'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile fullscreen menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[100] lg:hidden animate-menuFadeIn">
          {/* Menu panel - full screen */}
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--primary-900)] to-[var(--primary-800)]">
            {/* Menu header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-200 bg-clip-text text-transparent">{SITE_BRAND}</span>
              </div>
              <button
                onClick={closeMenu}
                className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

          {/* Navigation links */}
          <nav className="px-4 py-4">
            {menuItems.map((item, index) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMenu}
                className={`flex items-center justify-between px-4 py-4 rounded-xl hover:bg-white/10 transition-all duration-200 text-white group ${
                  mobileMenuOpen ? 'animate-slideIn' : ''
                }`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[var(--accent-500)]/20 flex items-center justify-center group-hover:bg-[var(--accent-500)]/30 transition-colors">
                    <item.icon className="w-5 h-5 text-[var(--accent-400)]" />
                  </div>
                  <span className="font-medium text-lg">{item.label}</span>
                </div>
                <ChevronRight className="w-5 h-5 text-white/40 group-hover:text-white/70 group-hover:translate-x-1 transition-all" />
              </Link>
            ))}
          </nav>

          {/* Phone CTA */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10 bg-[var(--primary-900)]/80 backdrop-blur">
            <div className="flex gap-3">
              <a
                href={contacts.telegramHref}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-14 py-4 bg-gradient-to-r from-[var(--accent-500)] to-[var(--accent-600)] hover:from-[var(--accent-600)] hover:to-[var(--accent-700)] rounded-xl transition-all shadow-lg shadow-amber-500/20"
                aria-label="Telegram"
              >
                <TelegramIcon className="w-6 h-6 text-white" />
              </a>
              {contacts.vkHref && (
                <a
                  href={contacts.vkHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center w-14 py-4 bg-gradient-to-r from-[var(--accent-500)] to-[var(--accent-600)] hover:from-[var(--accent-600)] hover:to-[var(--accent-700)] rounded-xl transition-all shadow-lg shadow-amber-500/20"
                  aria-label="ВКонтакте"
                >
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M15.684 0H8.316C1.592 0 0 1.592 0 8.316v7.368C0 22.408 1.592 24 8.316 24h7.368C22.408 24 24 22.408 24 15.684V8.316C24 1.592 22.391 0 15.684 0zm3.692 17.123h-1.744c-.66 0-.864-.525-2.05-1.727-1.033-1-1.49-1.135-1.744-1.135-.356 0-.458.102-.458.593v1.575c0 .424-.135.678-1.253.678-1.846 0-3.896-1.118-5.335-3.202C4.624 10.857 4.03 8.57 4.03 8.096c0-.254.102-.491.593-.491h1.744c.44 0 .61.203.78.677.863 2.49 2.303 4.675 2.896 4.675.22 0 .322-.102.322-.66V9.721c-.068-1.186-.695-1.287-.695-1.71 0-.204.17-.407.44-.407h2.744c.373 0 .508.203.508.643v3.473c0 .372.17.508.271.508.22 0 .407-.136.813-.542 1.27-1.422 2.18-3.61 2.18-3.61.119-.254.322-.491.763-.491h1.744c.525 0 .644.27.525.643-.22 1.017-2.354 4.031-2.354 4.031-.186.305-.254.44 0 .78.186.254.796.779 1.203 1.253.745.847 1.32 1.558 1.473 2.05.17.49-.085.744-.576.744z"/>
                  </svg>
                </a>
              )}
              <a
                href={contacts.phoneHref}
                className="flex items-center justify-center gap-3 flex-1 py-4 bg-gradient-to-r from-[var(--accent-500)] to-[var(--accent-600)] hover:from-[var(--accent-600)] hover:to-[var(--accent-700)] rounded-xl font-bold text-lg text-white transition-all shadow-lg shadow-amber-500/20"
              >
                <Phone className="w-5 h-5" />
                {contacts.phoneNumber}
              </a>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Animation keyframes */}
      <style jsx>{`
        @keyframes menuFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-menuFadeIn {
          animation: menuFadeIn 0.3s ease-out forwards;
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-slideIn {
          animation: slideIn 0.3s ease-out forwards;
        }
      `}</style>

      {/* Mobile Search Overlay */}
      <MobileSearchOverlay 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </>
  );
}
