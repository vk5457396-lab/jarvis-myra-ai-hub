# MYRA Backend API (Vercel Serverless)

All endpoints live inside `api/` and deploy automatically with the Vite frontend on Vercel.
Every response is JSON — never HTML — including 404s (`api/[...path].js` catch-all).

## Required Vercel Environment Variables

| Name | Purpose |
| --- | --- |
| `SUPABASE_URL` | Backend database URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key (never exposed to client) |
| `JWT_SECRET` | Signs device activation tokens (64+ random chars) |
| `JWT_EXPIRES_IN` | Optional, default `365d` |
| `ADMIN_API_KEY` | Shared secret for admin endpoints |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase service-account JSON (raw or base64) |
| `CORS_ORIGINS` | Comma separated, default `https://codeninjavik.in,https://www.codeninjavik.in` |
| `RATE_LIMIT_MAX` / `RATE_LIMIT_WINDOW_MS` | Optional throttling overrides |

## Endpoints

Public (Android):
- `GET /api/health`
- `POST /api/license/verify` — `{ license_key, device_id, app_version?, android_version? }`
- `POST /api/license/check` — header `Authorization: Bearer <activation_token>`, body `{ device_id? }`
- `POST /api/device/register` — `{ device_id, user_id?, fcm_token?, app_version?, android_version? }`

Admin (`x-admin-key: <ADMIN_API_KEY>` **or** an admin user's Supabase access token):
- `POST /api/license/generate` — `{ plan, quantity, prefix?, length? }` (keys stored in the database)
- `POST /api/license/reset` · `POST /api/license/deactivate` · `POST /api/license/renew`
- `GET|POST /api/license/details` — query `?license_key=...` or body `{ license_key }`
- `POST /api/notification/send` · `sendToUser` · `sendToDevice`
- `GET /api/notification/history?limit=&offset=`

## Response shape

```json
{ "success": true, "message": "OK", "data": {} }
{ "success": false, "message": "Reason", "error_code": "LICENSE_NOT_FOUND" }
```

Plans: `1_month` (30d), `2_months` (60d), `lifetime` (never expires). Expiry always starts at
first activation, and licenses are locked to one `device_id` until an admin resets them.
