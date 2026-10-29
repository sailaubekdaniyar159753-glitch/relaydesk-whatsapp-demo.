# DenSai WhatsApp Cloud API integration

Status: staging modules only; NOT deployed to production.

## Existing components
- reply-engine.mjs: categorizes inbound client/worker questions and provides safe default replies.
- webhook-handler.mjs: handles the Meta GET verify challenge and validates POST HMAC-SHA256 signature.
- *.test.mjs: Node 20+ tests; run with `node --test whatsapp-bot/*.test.mjs` or separately with `node whatsapp-bot/webhook-handler.test.mjs`.

## Integration into an existing Cloudflare Worker
At the beginning of the existing Worker request handler, route only `/webhook` to `handleWhatsAppWebhook(request, env)`. Do not replace existing /health, D1 bindings, or other routes. Confirm the actual Worker source path before editing.

Use Cloudflare Worker Secrets (never commit values):
- META_VERIFY_TOKEN: long randomly generated string, also entered in Meta callback configuration.
- META_APP_SECRET: Meta application's App Secret.

Required before enabling replies:
1. Dedicated D1 event-id uniqueness / deduplication logic, to prevent sending replies twice on webhook retries.
2. Persistent opt-out and consent settings, and handoff to a human.
3. Configure temporary test phone number and phone_number_id with WhatsApp Cloud API.
4. Configure sending token as a Cloudflare Secret, grant minimal permissions, verify test recipients.
5. Review data retention and Kazakhstan personal data storage requirements; do not store real client data in D1 pending compliance review.
6. Run tests and integration smoke tests against staging. Webhook currently responds EVENT_RECEIVED for authentic events but deliberately sends no WhatsApp message.

Use Meta Webhooks callback: https://personal-elit-bot.sailaubekdaniyar159753.workers.dev/webhook ONLY after that route is deployed and ready.
