"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  Timer,
  Receipt,
  User,
  Trophy,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { label: "Home",     href: "/employee/dashboard", icon: Home },
  { label: "Sessions", href: "/employee/sessions", icon: Timer },
  { label: "Expenses", href: "/employee/expenses", icon: Receipt },
  { label: "Profile",  href: "/profile",           icon: User },
  { label: "Leaderboard", href: "/leaderboard",    icon: Trophy },
];

interface EmployeeSidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export function EmployeeSidebar({ isMobileOpen = false, onClose }: EmployeeSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex flex-col w-64",
        "transition-transform duration-300 ease-in-out",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        "md:relative md:translate-x-0 md:z-auto md:rounded-2xl md:my-3 md:ml-3"
      )}
      style={{
        background: "hsl(var(--surface))",
        boxShadow: "0 1px 3px hsl(var(--shadow) / 0.07), 0 4px 20px hsl(var(--shadow) / 0.06)",
      }}
    >
      {/* Logo + mobile close */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-outline-variant/10">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 ring-1 ring-primary/20 shrink-0">
          <Image
            src="/logo/logo.png"
            alt="FieldTrack"
            width={36}
            height={36}
            className="h-8 w-8 rounded-full object-contain"
            priority
          />
        </div>
        <div className="flex-1 min-w-0">
          <span className="font-lexend font-bold text-base text-on-surface tracking-tight block">
            FieldTrack
          </span>
          <span className="text-[10px] font-semibold text-primary/70 uppercase tracking-widest">Field App</span>
        </div>
        <button
          className="md:hidden btn-icon"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Section label */}
      <div className="px-5 pt-5 pb-2">
        <span className="section-heading">Main Menu</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/employee/dashboard"
              ? pathname === "/employee/dashboard" || pathname === "/employee/home"
              : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className={cn("nav-item", isActive && "active")}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom actions */}
      <div className="px-3 pb-5 space-y-0.5 border-t border-outline-variant/10 pt-3">
        <button
          onClick={logout}
          className="nav-item w-full text-error hover:text-error hover:bg-error-container/10"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
