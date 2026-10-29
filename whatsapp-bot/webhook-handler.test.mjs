import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { handleWhatsAppWebhook, verifyMetaSignature } from "./webhook-handler.mjs";

const env = { META_VERIFY_TOKEN: "test-token", META_APP_SECRET: "test-secret" };
const url = "https://example.workers.dev/webhook";
const get = (query) => new Request(url + query);
assert.equal((await handleWhatsAppWebhook(get("?hub.mode=subscribe&hub.verify_token=test-token&hub.challenge=123"), env)).status, 200);
assert.equal((await handleWhatsAppWebhook(get("?hub.mode=subscribe&hub.verify_token=wrong&hub.challenge=123"), env)).status, 403);
const body = JSON.stringify({ object: "whatsapp_business_account", entry: [{ changes: [{ field: "messages", value: { messages: [{ type: "text", text: { body: "Нужен бот" } }] } }] }] });
const signature = "sha256=" + createHmac("sha256", env.META_APP_SECRET).update(body).digest("hex");
assert.equal(await verifyMetaSignature(body, signature, env.META_APP_SECRET), true);
assert.equal(await verifyMetaSignature(body + "changed", signature, env.META_APP_SECRET), false);
assert.equal((await handleWhatsAppWebhook(new Request(url, { method: "POST", body, headers: { "x-hub-signature-256": signature } }), env)).status, 200);
assert.equal((await handleWhatsAppWebhook(new Request(url, { method: "POST", body, headers: { "x-hub-signature-256": "sha256=" + "0".repeat(64) } }), env)).status, 403);
console.log("6 webhook tests passed");
