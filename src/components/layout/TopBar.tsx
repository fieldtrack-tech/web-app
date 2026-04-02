"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { Bell, Building2, Menu, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getInitials } from "@/lib/utils";

interface TopBarProps {
  orgName?: string;
  onMenuClick?: () => void;
}

export function TopBar({ orgName, onMenuClick }: TopBarProps) {
  const { user, role, logout } = useAuth();
  const isAdmin = role === "ADMIN";
  const initials = getInitials(user?.user_metadata?.full_name ?? user?.email ?? "");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <header className="flex items-center justify-between h-14 px-4 md:px-6 bg-surface-container-low border-b border-outline-variant/20">
      {/* Left: hamburger (mobile) */}
      <div className="flex items-center gap-2">
        {/* Hamburger — only visible on mobile */}
        <button
          className="md:hidden btn-icon"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Org label (admin) — display only, no dropdown */}
        {isAdmin && (
          <div className="hidden sm:flex items-center gap-1.5 px-3 h-8 rounded-xl text-xs font-medium text-on-surface-variant bg-surface-container select-none">
            <Building2 className="w-3.5 h-3.5" />
            {orgName ?? "Organization"}
          </div>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Bell — display only (no unread notifications) */}
        <div className="btn-icon cursor-default opacity-60" aria-label="Notifications (coming soon)" title="Notifications coming soon">
          <Bell className="w-4 h-4" />
        </div>

        {/* Avatar with user dropdown */}
        <div className="relative" ref={menuRef}>
          <button
            className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-container text-on-primary-container text-xs font-bold uppercase hover:ring-2 hover:ring-primary/40 transition-all"
            aria-label="User menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {initials}
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-10 z-50 w-52 rounded-2xl border border-outline-variant/30 bg-surface-container-high shadow-ambient py-1.5 animate-fade-in">
              {/* User info */}
              <div className="px-3 py-2 border-b border-outline-variant/20">
                <p className="text-xs font-semibold text-on-surface truncate">
                  {user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? "User"}
                </p>
                <p className="text-[11px] text-on-surface-variant truncate">{user?.email}</p>
              </div>

              {/* Actions */}
              <Link
                href="/profile"
                className="flex items-center gap-2.5 px-3 py-2 text-sm text-on-surface-variant hover:bg-surface-container-highest hover:text-on-surface transition-colors"
                onClick={() => setMenuOpen(false)}
              >
                <User className="w-3.5 h-3.5" />
                My Profile
              </Link>

              <button
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-error hover:bg-error/10 transition-colors"
                onClick={() => { setMenuOpen(false); void logout(); }}
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
