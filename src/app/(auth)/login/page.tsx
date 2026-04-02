"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { Spinner } from "@/components/ui";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const role = await login(email.trim(), password);
      if (role === "ADMIN") {
        router.replace("/admin/dashboard");
      } else {
        router.replace("/employee/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const busy = loading;

  return (
    <div className="w-full max-w-sm space-y-8 animate-fade-in">
      {/* Logo / branding */}
      <div className="text-center space-y-2">
        <Image
          src="/logo/logo.png"
          alt="FieldTrack"
          width={56}
          height={56}
          className="mx-auto h-14 w-14 rounded-full object-contain mb-2"
          priority
        />
        <h1 className="font-manrope font-bold text-3xl text-on-surface tracking-tight">
          FieldTrack
        </h1>
        <p className="text-sm text-on-surface-variant">
          Sign in to your workspace
        </p>
      </div>

      {/* Card */}
      <div className="card-high space-y-5">
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input w-full"
              placeholder="you@company.com"
            />
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-xs font-medium text-on-surface-variant uppercase tracking-wider"
            >
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPw ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input w-full pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                className="btn-icon absolute right-2 top-1/2 -translate-y-1/2"
                tabIndex={-1}
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-error bg-error/10 rounded-xl px-3 py-2">
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            className="btn-primary w-full mt-2"
            disabled={busy || !email || !password}
          >
            {busy ? <Spinner size="sm" /> : null}
            Sign In
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-on-surface-variant">
        Contact your administrator if you need access.
      </p>
    </div>
  );
}
