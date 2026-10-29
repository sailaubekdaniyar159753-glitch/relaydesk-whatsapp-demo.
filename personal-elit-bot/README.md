# Персонал Элит — WhatsApp Cloud API Bot

This is a separate project root inside the pre-existing WhatsApp demo repository on a dedicated branch. The `main` branch and demo are unchanged.

Cloudflare Worker: `personal-elit-bot`
Git repository branch: `personal-elit-bot`
Cloudflare **Root directory**: `personal-elit-bot`
Deploy command: `npx wrangler deploy`

## Before connecting WhatsApp
1. Deploy Worker via Cloudflare > Connect GitHub; select branch and root directory above.
2. Create D1 database `personal-elit-leads` and apply `schema.sql`.
3. Add D1 binding `DB` and update `wrangler.toml` with actual `database_id`.
4. Add **secrets in Cloudflare dashboard only**: `META_APP_SECRET`, `META_VERIFY_TOKEN`, `META_ACCESS_TOKEN`, `META_PHONE_NUMBER_ID`. Never put tokens in GitHub or chat.
5. Set Meta webhook URL to deployed `https://<worker>.<account>.workers.dev/webhook`, and subscribe to `messages`.
6. Before changing existing +7 702 951 74 34 number, verify supported WhatsApp Business App Coexistence. Do not remove the app or unregister the number.
7. Bot sends only replies to incoming messages and enforces its own conservative `900` message/month cap; Meta billing remains independent.

Endpoints: `/health` (read-only), `/webhook` (Meta challenge and signed POST). Never claim connected unless health says metaConnected=true and actual Meta handshake passes.
