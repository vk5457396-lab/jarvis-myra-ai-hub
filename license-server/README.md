# MYRA License Server

Production-ready license verification & activation backend for the **MYRA** Android AI Assistant.

Built with **Node.js + Express + Supabase + JWT**, ready to deploy on **Render**.

---

## Features

- Device-locked license activation (one device per key)
- Expiry starts **only at first activation** — never from key generation date
- Plans: `1 Month` (30 days), `2 Month` (60 days), `Lifetime` (never expires)
- Signed JWT activation tokens containing license id, plan, device id, activation & expiry
- Admin endpoints for device reset, deactivation and renewal
- Always returns JSON — never HTML, never plain text, never a default Express error page
- Helmet, CORS, Compression, Morgan logging, rate limiting, strict input validation

---

## Project structure

```
license-server/
├── src/
│   ├── config/          env.js, constants.js
│   ├── database/        supabaseClient.js
│   ├── middleware/      auth.js, adminAuth.js, errorHandler.js, rateLimiter.js, requestLogger.js
│   ├── controllers/     licenseController.js, healthController.js
│   ├── routes/          index.js, licenseRoutes.js, healthRoutes.js
│   ├── services/        licenseService.js, licenseRepository.js, jwtService.js
│   ├── utils/           ApiError.js, asyncHandler.js, logger.js, plan.js, response.js, validators.js
│   ├── app.js
│   └── server.js
├── .env.example
├── render.yaml
├── package.json
└── README.md
```

---

## Database table (`public.licenses`)

| Column             | Type          | Notes                                     |
| ------------------ | ------------- | ----------------------------------------- |
| `id`               | uuid          | primary key                               |
| `license_key`      | text          | unique, e.g. `MYRA-XXXX-XXXX-XXXX`        |
| `plan`             | text          | `1_month` \| `2_months` \| `lifetime`     |
| `duration`         | int           | optional day override                     |
| `status`           | text          | `available` \| `activated` \| `expired` \| `disabled` |
| `device_id`        | text          | bound Android ID, null until activation   |
| `activation_token` | text          | last issued JWT                           |
| `activated_at`     | timestamptz   | first activation instant                  |
| `expires_at`       | timestamptz   | null for lifetime                         |
| `created_at`       | timestamptz   |                                           |
| `updated_at`       | timestamptz   |                                           |

The server talks to Supabase with the **service role key**, so row level security does not block it. That key lives only in the server environment and is never returned in any response.

---

## Setup

```bash
cd license-server
cp .env.example .env      # fill in the values
npm install
npm start
```

Server listens on `http://localhost:8080`.

### Environment variables

| Variable                    | Required | Description                                        |
| --------------------------- | -------- | -------------------------------------------------- |
| `PORT`                      | no       | default `8080` (Render injects its own)            |
| `NODE_ENV`                  | no       | `production` in deployment                          |
| `CORS_ORIGINS`              | no       | comma separated origins, `*` to allow all           |
| `SUPABASE_URL`              | **yes**  | your project URL                                    |
| `SUPABASE_SERVICE_ROLE_KEY` | **yes**  | server-only key                                     |
| `JWT_SECRET`                | **yes**  | 64+ random chars (`openssl rand -hex 32`)           |
| `JWT_EXPIRES_IN`            | no       | default `365d` (lifetime plans only)                |
| `ADMIN_API_KEY`             | **yes**  | shared secret for admin endpoints                   |
| `RATE_LIMIT_WINDOW_MS`      | no       | default `60000`                                     |
| `RATE_LIMIT_MAX`            | no       | default `60` requests per window per IP             |

---

## API

Base URL: `https://<your-render-service>.onrender.com/api`

### `GET /api/health`

```json
{ "status": "ok", "database": "connected", "uptime": 42, "timestamp": "..." }
```

### `POST /api/license/verify`

Request:

```json
{
  "license_key": "MYRA-XXXX-XXXX-XXXX",
  "device_id": "ANDROID_ID",
  "app_version": "1.0.0",
  "android_version": "15"
}
```

Success `200`:

```json
{
  "success": true,
  "plan": "Lifetime",
  "plan_id": "lifetime",
  "expires_at": null,
  "activated_at": "2026-07-31T04:00:00.000Z",
  "activation_token": "JWT_TOKEN",
  "license": { "...": "..." }
}
```

Failures:

| Case                          | HTTP | Body message                                    |
| ----------------------------- | ---- | ----------------------------------------------- |
| License does not exist        | 404  | `Invalid license.`                              |
| License disabled              | 403  | `License disabled.`                             |
| Bound to a different device   | 409  | `License already activated on another device.`  |
| Expired                       | 403  | `License expired.`                              |
| Bad/missing fields            | 400  | validation message                              |

### `POST /api/license/check`

Header: `Authorization: Bearer <activation_token>` (or `activation_token` in the body).

Optional body: `{ "device_id": "ANDROID_ID" }`

Success `200`:

```json
{
  "success": true,
  "valid": true,
  "license_key": "MYRA-XXXX-XXXX-XXXX",
  "plan": "1 Month",
  "plan_id": "1_month",
  "status": "activated",
  "device_id": "ANDROID_ID",
  "activated_at": "...",
  "expires_at": "..."
}
```

### Admin endpoints

All require `Authorization: Bearer <ADMIN_API_KEY>` (or `x-admin-key: <ADMIN_API_KEY>`).

| Endpoint                          | Body                                     | Effect                                                      |
| --------------------------------- | ---------------------------------------- | ----------------------------------------------------------- |
| `POST /api/license/reset`         | `{ "license_key": "..." }`               | clears `device_id`, `activation_token`, activation & expiry |
| `POST /api/license/deactivate`    | `{ "license_key": "..." }`               | sets status to `disabled`                                    |
| `POST /api/license/renew`         | `{ "license_key": "...", "days": 30, "plan": "1_month" }` | extends `expires_at` (plan optional)        |
| `GET  /api/license/details/:license` | –                                     | full license record                                          |

---

## Android integration

```
Base URL: https://<your-render-service>.onrender.com
Verify  : POST /api/license/verify
Check   : POST /api/license/check   (Authorization: Bearer <token>)
```

If you want the endpoint to answer on `https://codeninjavik.in/api/license/verify`, point a
reverse proxy / DNS rule for the `/api/*` path of your domain at the Render service, or simply
set the Android base URL to the Render URL (or a `api.codeninjavik.in` subdomain attached to the
Render service as a custom domain).

---

## Deploy to Render

1. Push this folder to a Git repository.
2. In Render: **New → Web Service**, connect the repo.
3. Settings:
   - **Root Directory:** `license-server`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Health Check Path:** `/api/health`
4. Add the environment variables from `.env.example` (Render sets `PORT` automatically).
5. Deploy. Verify with:

```bash
curl https://<your-service>.onrender.com/api/health
```

`render.yaml` is included for Blueprint deployments — the secret values are marked `sync: false`
so you enter them in the dashboard.

---

## Security notes

- The service role key is read from the environment only and never leaves the server.
- Admin routes use a timing-safe comparison of a shared secret.
- Activation is atomic (`device_id IS NULL` guard) so two devices cannot claim the same key.
- Rate limiting protects against license key brute forcing.
- Logs never include license keys, tokens or request bodies.
