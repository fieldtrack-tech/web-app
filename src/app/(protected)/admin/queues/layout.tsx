import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Dev-internal route guard for /admin/queues.
 *
 * Access is restricted to users who have `is_dev: true` set in their
 * Supabase app_metadata (set via the Supabase admin API or dashboard —
 * never writable by the client). The middleware already ensures ADMIN role;
 * this layout adds a second, user-level gate so that not all admins can
 * reach BullMQ internals in production.
 *
 * To grant access: set `app_metadata.is_dev = true` for the user via
 * the Supabase dashboard or service-role API.
 */
export default async function QueuesDevLayout({ children }: { children: ReactNode }) {
  const cookieStore = cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // app_metadata is set server-side only (not writable by the browser) so
  // this flag cannot be forged by a client.
  // Use explicit guard against undefined/null to prevent any edge cases.
  const appMetadata = session?.user?.app_metadata as Record<string, unknown> | undefined;
  const isDev = appMetadata?.is_dev === true;

  if (!isDev) {
    notFound();
  }

  return <>{children}</>;
}
