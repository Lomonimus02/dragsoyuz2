"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Search, Menu, X, Zap, Package, Phone, MapPin, Loader2, ChevronRight, Home, Mail, ClipboardList, BookOpen, TelegramIcon } from "@/app/(root)/components/icons";
import { VkIcon } from "./BrandIcons";
import { WhatsAppIcon } from "./icons";
import { findBestMatchProduct, getProducts, ProductWithPrice } from "@/app/actions";
import { MobileSearchOverlay } from "./MobileSearchOverlay";
import { Brand } from "./Brand";
import { DEFAULT_SITE_VK_URL } from "@/lib/site";

// Тип контактных данных для Header
export interface HeaderContactInfo {
  phoneNumber: string;
  phoneHref: string;
  telegramHref: string;
  vkHref: string;
  whatsappHref?: string;
  workSchedule: string;
}

// Дефолтные значения на случай если данные не загружены
const DEFAULT_CONTACTS: HeaderContactInfo = {
  phoneNumber: "+7 (812) 983-49-76",
  phoneHref: "tel:+78129834976",
  telegramHref: "https://t.me/dragsoyuz",
  vkHref: DEFAULT_SITE_VK_URL,
  workSchedule: "Ежедневно с 10:00 до 20:00",
};

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
  categories?: { name: string; slug: string }[];
}

export function Header({ contactInfo, categories = [] }: HeaderProps) {
  const contacts = contactInfo || DEFAULT_CONTACTS;
  const router = useRouter();
  const pathname = usePathname();
  const [catalogExpanded, setCatalogExpanded] = useState(false);
  const drawerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [desktopSearchResults, setDesktopSearchResults] = useState<ProductWithPrice[]>([]);
  const [isLoadingDesktopResults, setIsLoadingDesktopResults] = useState(false);

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const shell = document.querySelector<HTMLElement>(".storefront-shell");
    const oldOverflow = shell?.style.overflowY ?? "";
    if (shell) shell.style.overflowY = "hidden";
    drawerRef.current?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
      if (event.key === "Tab") {
        const items = drawerRef.current?.querySelectorAll<HTMLElement>('a[href],button:not([disabled]),input');
        if (!items?.length) return;
        const first = items[0], last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      if (shell) shell.style.overflowY = oldOverflow;
      menuButtonRef.current?.focus();
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
      <header className="rk-header relative z-50">
        <div className="container mx-auto px-4">
          <div className="rk-header-main">
            <Link href="/" aria-label="РадиоКлад — главная"><Brand /></Link>
            <form
              onSubmit={handleSearch}
              className="rk-desktop-search hidden lg:flex flex-1 min-w-0 max-w-xl"
            >
              <div className="relative w-full group">
                <input
                  type="search"
                  aria-label="Поиск по каталогу"
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
                  aria-label="Найти радиодеталь"
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


            <div className="rk-header-contact">
              <a href={contacts.phoneHref}>{contacts.phoneNumber}</a>
              <span>{contacts.workSchedule}</span>
            </div>
            <div className="rk-socials">
              <a href={contacts.telegramHref} target="_blank" rel="noopener noreferrer" aria-label="Telegram"><TelegramIcon className="w-5 h-5" /></a>
              {contacts.whatsappHref && <a href={contacts.whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><WhatsAppIcon className="w-5 h-5" /></a>}
              {contacts.vkHref && <a href={contacts.vkHref} target="_blank" rel="noopener noreferrer" aria-label="ВКонтакте"><VkIcon className="w-5 h-5" /></a>}
            </div>
            <div className="rk-mobile-actions">
              <a href={contacts.phoneHref} aria-label="Позвонить"><Phone className="w-5 h-5" /></a>
              <button onClick={() => setIsSearchOpen(true)} aria-label="Открыть поиск"><Search className="w-5 h-5" /></button>
              <button ref={menuButtonRef} onClick={() => setMobileMenuOpen(true)} aria-label="Открыть меню" aria-expanded={mobileMenuOpen} aria-controls="mobile-navigation"><Menu className="w-6 h-6" /></button>
            </div>
          </div>
          <nav className="rk-desktop-nav" aria-label="Основная навигация">
            {[menuItems[1], menuItems[2], menuItems[4], menuItems[6], menuItems[5], menuItems[3]].map(item => <Link key={item.href} href={item.href} aria-current={pathname.startsWith(item.href) ? "page" : undefined}>
              {item.href === "/catalog" && <Package className="w-4 h-4" />}{item.label}
            </Link>)}
            <span className="rk-location"><MapPin className="w-3.5 h-3.5" /> Санкт-Петербург</span>
          </nav>
        </div>
      </header>
      {mobileMenuOpen && <div className="rk-menu-layer">
        <button className="rk-menu-backdrop" onClick={closeMenu} aria-label="Закрыть меню" tabIndex={-1} />
        <aside id="mobile-navigation" ref={drawerRef} tabIndex={-1} className="rk-drawer" role="dialog" aria-modal="true" aria-label="Навигация">
          <div className="rk-drawer-top"><Brand /><button onClick={closeMenu} aria-label="Закрыть меню"><X className="w-5 h-5" /></button></div>
          <p className="rk-eyebrow">Радиодетали с ценностью</p>
          <nav aria-label="Мобильная навигация">
            {menuItems.map(item => <div key={item.href}>
              <div className="rk-drawer-row">
                <Link href={item.href} onClick={closeMenu} aria-current={(item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)) ? "page" : undefined}><item.icon className="w-4 h-4" />{item.label}</Link>
                {item.href === "/catalog" && <button onClick={() => setCatalogExpanded(!catalogExpanded)} aria-label="Развернуть категории" aria-expanded={catalogExpanded}><ChevronRight className={`w-4 h-4 ${catalogExpanded ? "rotate-90" : ""}`} /></button>}
              </div>
              {item.href === "/catalog" && catalogExpanded && <div className="rk-drawer-categories">{categories.map(category => <Link key={category.slug} href={`/catalog/${category.slug}`} onClick={closeMenu}>{category.name}</Link>)}</div>}
            </div>)}
          </nav>
          <div className="rk-drawer-contact"><span>Обсудим ваши детали</span><a href={contacts.phoneHref}>{contacts.phoneNumber}</a><p>{contacts.workSchedule}</p>
            <div className="rk-socials">
              <a href={contacts.telegramHref} target="_blank" rel="noopener noreferrer" aria-label="Telegram"><TelegramIcon className="w-5 h-5" /></a>
              {contacts.whatsappHref && <a href={contacts.whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp"><WhatsAppIcon className="w-5 h-5" /></a>}
              {contacts.vkHref && <a href={contacts.vkHref} target="_blank" rel="noopener noreferrer" aria-label="ВКонтакте"><VkIcon className="w-5 h-5" /></a>}
            </div>
          </div>
        </aside>
      </div>}
      <MobileSearchOverlay isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
