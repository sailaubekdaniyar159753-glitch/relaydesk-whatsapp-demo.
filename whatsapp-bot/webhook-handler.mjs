import { buildReply } from "./reply-engine.mjs";

const enc = new TextEncoder();
function equal(a, b) {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a[i] ^ b[i];
  return difference === 0;
}
export async function verifyMetaSignature(body, signature, secret) {
  if (!secret || !/^sha256=[a-f0-9]{64}$/i.test(signature || "")) return false;
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const calculated = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(body)));
  const hex = signature.slice(7);
  const supplied = new Uint8Array(hex.match(/.{2}/g).map((part) => parseInt(part, 16)));
  return equal(calculated, supplied);
}
export async function handleWhatsAppWebhook(request, env) {
  const url = new URL(request.url);
  if (url.pathname !== "/webhook") return new Response("Not found", { status: 404 });
  if (request.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && env.META_VERIFY_TOKEN && token === env.META_VERIFY_TOKEN && challenge !== null) {
      return new Response(challenge, { status: 200, headers: { "content-type": "text/plain" } });
    }
    return new Response("Forbidden", { status: 403 });
  }
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });
  if (!env.META_APP_SECRET) return new Response("Not configured", { status: 503 });
  const body = await request.text();
  if (body.length > 1048576) return new Response("Payload too large", { status: 413 });
  if (!(await verifyMetaSignature(body, request.headers.get("x-hub-signature-256"), env.META_APP_SECRET))) {
    return new Response("Invalid signature", { status: 403 });
  }
  let payload;
  try { payload = JSON.parse(body); } catch { return new Response("Invalid JSON", { status: 400 }); }
  if (payload?.object !== "whatsapp_business_account") return new Response("Ignored", { status: 200 });
  // Safe initial integration: authenticate and parse. Do not send or persist data
  // until idempotency, opt-out persistence, and production number configuration are tested.
  const messages = (payload.entry || []).flatMap(entry =>
    (entry.changes || []).flatMap(change => change.field === "messages" ? (change.value?.messages || []) : []));
  for (const message of messages) {
    if (message.type === "text" && typeof message.text?.body === "string") {
      buildReply(message.text.body);
    }
  }
  return new Response("EVENT_RECEIVED", { status: 200 });
}
