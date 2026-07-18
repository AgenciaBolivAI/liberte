// supabase-js builds a Realtime client eagerly inside createClient() and
// resolves a WebSocket implementation at construction time. On Node < 22 there
// is no global WebSocket, so it throws:
//   "Node.js detected but native WebSocket not found."
// even for plain REST/auth usage. We never use Realtime on the server, so we
// hand it a stub when the runtime has no WebSocket of its own. Passing an
// explicit `transport` short-circuits the library's detection entirely.
// Runtimes that do have WebSocket (browsers, Cloudflare Workers, Node 22+)
// keep using the real one.

class UnsupportedWebSocket {
  constructor() {
    throw new Error("Supabase Realtime is not available in this runtime.");
  }
}

export const realtimeTransport =
  typeof globalThis.WebSocket !== "undefined"
    ? globalThis.WebSocket
    : (UnsupportedWebSocket as unknown as typeof globalThis.WebSocket);

export const realtimeOptions = { transport: realtimeTransport };
