Contract signing extends the existing quotation sharing server (`npm run sharing:server`).

Use its existing `QUOTATION_ADMIN_TOKEN` (at least 32 characters), `QUOTATION_PUBLIC_ORIGIN` (the public HTTPS frontend origin), optional `QUOTATION_PORT` (8787), and `QUOTATION_DATA_FILE` settings. Signing records are written atomically to `<QUOTATION_DATA_FILE>.contracts.json`; keep this server data directory persistent and private. Run one server process per data file.

Proxy `/api/v1/contract-signing/*` and `/api/v1/public-contracts/*` to the sharing server in production. Serve `/contracts/sign/*` through the frontend SPA fallback. The Vite development proxy already includes both API paths. For local testing, use the generated URL path on the local Vite origin; real customer links require the configured public HTTPS origin to serve the app and API.

In Contract Detail, Send to Customer prompts for the existing sharing administrator token if it is absent. It is stored in sessionStorage under the same key as quotation sharing. There is no email transport in the existing server: copy and deliver the generated link yourself. Resend refreshes the sent time/expiry and records an activity; it does not send email.

The server owns the immutable public document snapshot, 256-bit random signing token reference, structured signature strokes, document SHA-256 digest, timestamps, and status events. Public responses contain only the selected contract, customer signature and company-signed flag; they exclude internal activities, deal data, credentials and company employee details. The customer entry loads independently of the CRM provider and layout. This feature does not add authentication to the existing demo CRM: production CRM access must still be protected by the deployment's authentication layer. Company identity uses the existing app profile and sharing administrator credential, not verified individual identity or a legal compliance certification.

Contract Detail synchronizes server events into the existing deal activity list on open, focus, every 15 seconds, and manual refresh. Contract List uses the locally synchronized contract status. If browser persistence fails after a server success, refresh signing status after freeing browser storage. Unsigned requests can be revoked and edited; signed records cannot be edited, deleted or overwritten through the contract service. PDF uses the existing browser print / Save as PDF flow with both captured signatures.

Validation:

```
npm run test:contracts
npm run test:quotations
node scripts/check-contract-signing.mjs
npm run build
```

The browser check uses installed Chrome and isolated temporary server data; it does not contact the configured production sharing origin.
