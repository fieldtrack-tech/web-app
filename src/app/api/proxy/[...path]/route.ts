/**
 * Transparent reverse-proxy: /api/proxy/[...path] → backend
 *
 * Destination resolution (in priority order):
 *   1. API_DESTINATION_URL          — explicit server-side-only var (recommended for
 *                                     production when NEXT_PUBLIC_API_BASE_URL=/api/proxy)
 *   2. NEXT_PUBLIC_API_BASE_URL     — used as fallback only when it is a full URL
 *                                     (i.e. NOT "/api/proxy"), which covers direct-mode
 *                                     local dev without needing a second env var.
 *
 * The two-var split exists because NEXT_PUBLIC_* values are embedded in the browser
 * bundle.  In proxy mode you set NEXT_PUBLIC_API_BASE_URL=/api/proxy (safe to expose)
 * and API_DESTINATION_URL=https://api.example.com (server-side only, never in bundle).
 *
 * Buffers API responses and forwards the admin event stream as it arrives.
 */

function resolveDestination(): string | undefined {
  // 1. Explicit server-side override
  if (process.env.API_DESTINATION_URL) return process.env.API_DESTINATION_URL;
  // 2. Fallback: only when NEXT_PUBLIC_API_BASE_URL is an absolute URL
  //    (not "/api/proxy" which would create an infinite loop)
  const pub = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (pub && pub.startsWith("http")) return pub;
  return undefined;
}

const DESTINATION = resolveDestination();

async function handler(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  if (!DESTINATION) {
    return new Response(
      JSON.stringify({
        error:
          "Proxy destination is not configured. " +
          "Set API_DESTINATION_URL (server-side) or set NEXT_PUBLIC_API_BASE_URL " +
          "to a full URL for direct-mode dev.",
      }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }

  const segments = (await params).path;
  if (segments.some((segment) => segment === "." || segment === "..")) {
    return new Response(null, { status: 400 });
  }
  const path = segments.map(encodeURIComponent).join("/");
  const query = new URL(req.url).search;
  const url = `${DESTINATION.replace(/\/+$/, "")}/${path}${query}`;
  const streamEvents = req.method === "GET" && path === "admin/events";

  // Strip hop-by-hop / routing headers that must not be forwarded
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("cookie");
  if (streamEvents) headers.set("accept-encoding", "identity");

  const body =
    req.method === "GET" || req.method === "HEAD"
      ? undefined
      : await req.arrayBuffer();

  let res: Response;
  const upstream = new AbortController();
  const timeout = setTimeout(() => upstream.abort(), 15_000);
  try {
    res = await fetch(url, {
      method: req.method,
      headers,
      body,
      signal: AbortSignal.any([req.signal, upstream.signal]),
      cache: "no-store",
      redirect: "manual",
    });
    const responseHeaders = new Headers(res.headers);
    responseHeaders.delete("transfer-encoding");
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");
    responseHeaders.delete("connection");
    responseHeaders.set("cache-control", "no-store");

    if (streamEvents && res.ok && responseHeaders.get("content-type")?.startsWith("text/event-stream")) {
      responseHeaders.set("cache-control", "no-cache, no-transform");
      responseHeaders.set("x-accel-buffering", "no");
      return new Response(res.body, { status: res.status, headers: responseHeaders });
    }

    const noBody = req.method === "HEAD" || res.status === 204 || res.status === 205 || res.status === 304;
    return new Response(noBody ? null : await res.arrayBuffer(), { status: res.status, headers: responseHeaders });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upstream fetch failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  } finally {
    clearTimeout(timeout);
  }
}

export const GET = handler;
export const HEAD = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
