"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FolderOpen,
  ExternalLink,
  Menu,
  X,
  LogOut,
  ChevronRight,
  Settings,
  MessageSquare,
  BookOpen,
} from "lucide-react";
import { useState, useEffect } from "react";
import { logoutAdmin } from "@/app/actions";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  external?: boolean;
}

const navItems: NavItem[] = [
  {
    href: "/admin",
    label: "Дашборд (Курсы)",
    icon: <LayoutDashboard className="w-5 h-5" />,
  },
  {
    href: "/admin/catalog",
    label: "Управление каталогом",
    icon: <FolderOpen className="w-5 h-5" />,
  },
  {
    href: "/admin/reviews",
    label: "Отзывы",
    icon: <MessageSquare className="w-5 h-5" />,
  },
  {
    href: "/admin/articles",
    label: "Полезная информация",
    icon: <BookOpen className="w-5 h-5" />,
  },
  {
    href: "/admin/settings",
    label: "Настройки",
    icon: <Settings className="w-5 h-5" />,
  },
  {
    href: "/",
    label: "На сайт",
    icon: <ExternalLink className="w-5 h-5" />,
    external: true,
  },
];

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") {
      return pathname === "/admin";
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-slate-700">
        <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center">
          <FolderOpen className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-white">Админ-панель</h1>
          <p className="text-xs text-slate-400">Радиодетали</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            target={item.external ? "_blank" : undefined}
            onClick={onItemClick}
            className={`
              flex items-center gap-3 px-4 py-3 rounded-lg
              transition-all duration-200 group
              ${
                isActive(item.href) && !item.external
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              }
            `}
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.external ? (
              <ExternalLink className="w-4 h-4 opacity-50" />
            ) : (
              <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-50 transition-opacity ${isActive(item.href) ? 'opacity-50' : ''}`} />
            )}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-700 space-y-3">
        <form action={logoutAdmin}>
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Выйти из системы
          </button>
        </form>
        <p className="text-xs text-slate-500 text-center">
          © 2026 Радиодетали
        </p>
      </div>
    </div>
  );
}

// Мобильная шторка (Sheet/Drawer)
function MobileDrawer({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  // Закрываем при ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`
          fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden
          transition-opacity duration-300
          ${isOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
        `}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-72 bg-slate-900 text-white
          transform transition-transform duration-300 ease-out lg:hidden
          shadow-2xl
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <SidebarContent onItemClick={onClose} />
      </aside>
    </>
  );
}

// Desktop Sidebar (fixed)
function DesktopSidebar() {
  return (
    <aside className="hidden lg:flex fixed top-0 left-0 z-30 h-screen w-64 bg-slate-900 text-white flex-col shadow-xl">
      <SidebarContent />
    </aside>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="h-full overflow-y-auto bg-slate-100">
      {/* Desktop Sidebar - fixed */}
      <DesktopSidebar />

      {/* Mobile Drawer */}
      <MobileDrawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

      {/* Main content with offset for desktop sidebar */}
      <div className="lg:ml-64 min-h-full flex flex-col">
        {/* Mobile Header */}
        <header className="lg:hidden sticky top-0 z-20 bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shadow-sm">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            aria-label="Открыть меню"
          >
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
              <FolderOpen className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-semibold text-slate-800">Админ-панель</h1>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
