"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Timer,
  MapPin,
  Radar,
  CalendarCheck,
  Receipt,
  BarChart3,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

const NAV_ITEMS = [
  { label: "Dashboard",     href: "/admin/dashboard",   icon: LayoutDashboard },
  { label: "Employees",     href: "/admin/employees",   icon: Users },
  { label: "Sessions",      href: "/admin/sessions",    icon: Timer },
  { label: "Live Tracking", href: "/admin/tracking",    icon: MapPin },
  { label: "Monitoring",    href: "/admin/monitoring",  icon: Radar },
  { label: "Attendance",    href: "/admin/attendance",  icon: CalendarCheck },
  { label: "Expenses",      href: "/admin/expenses",    icon: Receipt },
  { label: "Analytics",     href: "/admin/analytics",   icon: BarChart3 },
];

interface AdminSidebarProps {
  isMobileOpen?: boolean;
  onClose?: () => void;
}

export function AdminSidebar({ isMobileOpen = false, onClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside
      className={cn(
        // Base: fixed on mobile so it overlays; relative on md+ so it participates in layout
        "fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-surface-container-low",
        "transition-transform duration-300 ease-in-out",
        // Mobile: hide by default, show when open
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        // md+: always visible, part of normal document flow
        "md:relative md:translate-x-0 md:z-auto"
      )}
    >
      {/* Logo + mobile close */}
      <div className="flex items-center gap-3 px-5 py-5">
        <Image
          src="/logo/logo.png"
          alt="FieldTrack"
          width={36}
          height={36}
          className="h-9 w-9 rounded-full object-contain"
          priority
        />
        <span className="font-manrope font-bold text-lg text-on-surface tracking-tight flex-1">
          FieldTrack
        </span>
        <button
          className="md:hidden btn-icon"
          onClick={onClose}
          aria-label="Close menu"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Section label */}
      <div className="px-5 pb-3">
        <span className="section-heading">Enterprise Operations</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
          const isActive =
            href === "/admin/dashboard"
              ? pathname === href
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
      <div className="px-3 pb-5 space-y-0.5">
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
