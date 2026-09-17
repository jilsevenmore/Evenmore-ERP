Quotation sharing extends the existing localStorage quotation register. The server persists only a customer-facing snapshot and share activity; it does not replace ERP quotations.

Run from `app`:

```powershell
$env:QUOTATION_ADMIN_TOKEN = '<a randomly generated secret of at least 32 characters>'
$env:QUOTATION_PUBLIC_ORIGIN = 'https://your-erp-domain.example'
npm run sharing:server
```

Generate a secret with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. Do not put it in a Vite environment variable or commit it. Enter it under **Share Quotation → Sharing server connection**; the browser retains it in sessionStorage for that session. This standalone adapter uses one administrator credential; an existing backend deployment should replace this boundary with its authenticated, tenant-scoped authorization.

The server binds to loopback port 8787. Vite proxies both sharing API paths during development. For external customers, deploy the built frontend at the configured HTTPS origin and reverse-proxy `/api/v1/quotation-sharing/*` and `/api/v1/public-quotations/*` to the server. Serve `/quote/*` with the SPA index fallback. Localhost URLs are deliberately not published. Hosting/proxy configuration is required before external links can work.

Set `QUOTATION_DATA_FILE` to a durable private location (default `server/data/quotation-shares.json`) and back it up. Run one server process per data file. The file contains customer quotations and reusable bearer links; restrict access and do not serve it as a static asset. Avoid logging public URL tokens at the proxy. Responses disable caching and the public page suppresses referrer and search indexing.

Publishing validates the quotation, creates a cryptographic 256-bit token, sets a 1–365 day expiry, and replaces the prior token. Public routes require both quotation number and token. They expose an explicit field projection, without ERP state, costs, CRM notes or balances. QR codes are generated locally from the published URL. Download permission controls the application download action; it cannot prevent a recipient from printing or saving already visible content.

Opening the public page posts a view event. The administrator ERP polls existing shares every 15 seconds while the app is open and authenticated, and also offers Refresh activity. Terminal quotation statuses are preserved. Link expiry does not imply that the commercial quotation itself has expired. Printing is the existing browser Save as PDF mechanism; activity is honestly labeled “PDF print requested,” since the browser cannot verify whether a PDF was saved.

No email or WhatsApp delivery provider exists in this repository. Send/Resend shows editable contact/message fields and attachment options with delivery explicitly disabled. It does not claim success or set Sent. Manual clipboard sharing records only a copy event. A future provider must acknowledge submission before recording a send event and updating status.

Quotation conversion creates a linked draft in the existing delivery challan register. Repeated conversion opens the same challan. Prepare Dispatch reuses its existing quantity and serial selection form and issues that same draft; only issuance changes stock. Cancelling an unissued draft has no stock effects. Existing sales order conversion remains available.

Verification: `npm run test:quotations`, `npm run build`, and ESLint on changed frontend files.

For the browser integration check, start Vite on port 5173, leave port 8787 free, and run `node server/quotation-browser-check.mjs`. It uses headless Chrome (`CHROME_PATH` can override its location), isolated browser state and temporary server data. It checks separate customer sessions, automatic Viewed synchronization, PDF rendering, draft conversion, stock posting on dispatch and duplicate prevention.

Reference UI: the existing detail modal now includes action cards, a milestone timeline, QR/link settings, Send/Resend tabs and a challan review dialog. Creation supports quotation date, optional deal reference and terms. OTP is visibly disabled until a delivery provider exists.

Customer acceptance/rejection is optional per share. Enable it before publishing to show customer response buttons. Responses require an active token and explicit confirmation, persist on the server, synchronize into the existing quotation status and activity, and cannot be changed through a second response. Repeated identical submissions are idempotent. Responses identify the holder of the secure link; they do not constitute OTP-verified identity.
