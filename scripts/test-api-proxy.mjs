import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import { test } from "node:test";

test("admin events stream promptly through the proxy and close on client abort", { timeout: 5000 }, async () => {
  const upstream = createServer();
  upstream.listen(0, "127.0.0.1");
  await once(upstream, "listening");
  process.env.API_DESTINATION_URL = `http://127.0.0.1:${upstream.address().port}`;
  const proxy = await import("../src/app/api/proxy/[...path]/route.ts");
  const cancel = new AbortController();

  try {
    const received = once(upstream, "request");
    const request = new Request("http://localhost/api/proxy/admin/events", {
      headers: { Authorization: "Bearer test-token", Accept: "text/event-stream", Cookie: "private=1" },
      signal: cancel.signal,
    });
    const pending = proxy.GET(request, { params: Promise.resolve({ path: ["admin", "events"] }) });
    const [incoming, stream] = await received;
    const closed = once(stream, "close");
    assert.equal(incoming.url, "/admin/events");
    assert.equal(incoming.headers.authorization, "Bearer test-token");
    assert.equal(incoming.headers.cookie, undefined);

    stream.writeHead(200, { "content-type": "text/event-stream" });
    stream.write("event: connected\ndata: {}\n\n");
    const response = await pending;
    assert.equal(response.headers.get("x-accel-buffering"), "no");
    const reader = response.body.getReader();
    assert.equal(new TextDecoder().decode((await reader.read()).value), "event: connected\ndata: {}\n\n");

    stream.write("event: session.checkin\ndata: {}\n\n");
    assert.equal(new TextDecoder().decode((await reader.read()).value), "event: session.checkin\ndata: {}\n\n");
    cancel.abort();
    await closed;

    upstream.once("request", (incoming, reply) => {
      assert.equal(incoming.url, "/check?reference=first%3Fsecond");
      reply.writeHead(204).end();
    });
    const empty = await proxy.DELETE(new Request("http://localhost/api/proxy/check?reference=first%3Fsecond", { method: "DELETE" }), {
      params: Promise.resolve({ path: ["check"] }),
    });
    assert.equal(empty.status, 204);
    assert.equal(empty.body, null);
  } finally {
    cancel.abort();
    upstream.closeAllConnections();
    await new Promise((resolve) => upstream.close(resolve));
    delete process.env.API_DESTINATION_URL;
  }
});
