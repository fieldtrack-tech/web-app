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
 * Fully buffers the backend response body before returning so callers never
 * receive a truncated / empty body ("Unexpected end of JSON input").
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
  { params }: { params: { path: string[] } },
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

  const path = params.path.join("/");
  const query = req.url.includes("?") ? "?" + req.url.split("?")[1] : "";
  const url = `${DESTINATION}/${path}${query}`;

  // Strip hop-by-hop / routing headers that must not be forwarded
  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");

  const body =
    req.method === "GET" || req.method === "HEAD"
      ? undefined
      : await req.arrayBuffer();

  let res: Response;
  try {
    res = await fetch(url, {
      method: req.method,
      headers,
      body,
      // Abort if the backend takes longer than 15 s
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upstream fetch failed";
    return new Response(JSON.stringify({ error: message }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }

  // Always read the full body into memory — never pipe the raw ReadableStream.
  // Streaming `res.body` directly through Next.js edge/node runtime can result
  // in the stream being consumed or closed before the client reads it, producing
  // empty responses and "Unexpected end of JSON input" on the frontend.
  const responseBody = await res.arrayBuffer();

  // Copy response headers; drop transfer-encoding so Node/browser can handle
  // the already-buffered body without chunked-encoding confusion.
  const responseHeaders = new Headers(res.headers);
  responseHeaders.delete("transfer-encoding");

  return new Response(responseBody, {
    status: res.status,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PATCH = handler;
export const PUT = handler;
export const DELETE = handler;
