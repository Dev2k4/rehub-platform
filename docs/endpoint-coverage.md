# Backend Endpoint Coverage Matrix

## Scope
- Source of truth for endpoints: backend routers under `backend/app/api/v1`.
- FE usage checked from feature APIs and hooks in `frontend/src/features` plus SDK usage in `frontend/src/client`.
- Status meanings:
  - `used`: endpoint is called by FE runtime flow.
  - `partially-used`: endpoint exists in FE layer but not fully wired in primary UI path.
  - `not-used`: no current FE runtime call.

## Auth (`/api/v1/auth`)
- `POST /register`: used
- `POST /login`: used
- `POST /refresh`: used
- `POST /verify-email`: used
- `POST /resend-verification`: used
- `POST /forgot-password`: used
- `POST /reset-password`: used
- `POST /logout`: used

## Users (`/api/v1/users`)
- `GET /me`: used
- `PUT /me`: used
- `GET /{user_id}/profile`: used

## Listings (`/api/v1/listings`)
- `GET /`: used
- `GET /me`: used
- `GET /{listing_id}`: used
- `POST /`: used
- `PATCH /{listing_id}`: used
- `DELETE /{listing_id}`: used
- `POST /{listing_id}/images`: used
- `DELETE /images/{image_id}`: used

## Offers (`/api/v1/offers`)
- `POST /`: used
- `GET /me/sent`: used
- `GET /me/received`: used
- `GET /listing/{listing_id}`: used
- `PATCH /{offer_id}/status`: used
- `GET /{offer_id}`: used

## Orders (`/api/v1/orders`)
- `POST /`: used
- `GET /me`: used
- `GET /{order_id}`: used
- `POST /{order_id}/complete`: used
- `POST /{order_id}/cancel`: used
- `GET /` (alias): partially-used
  - Backend currently aliases this to `get_my_orders`; FE uses `/me` path.

## Reviews (`/api/v1/reviews`)
- `POST /reviews`: used
- `GET /reviews/user/{user_id}`: used
- `GET /reviews/{order_id}`: used

## Notifications (`/api/v1/notifications`)
- `GET /`: used
- `GET /unread-count`: used
- `PUT /{notification_id}/read`: used
- `PUT /read-all`: used

## Wallet (`/api/v1/wallet`)
- `GET /me`: used
- `POST /demo-topup`: used
- `GET /transactions`: used

## Escrows (`/api/v1/escrows`)
- `GET /disputed`: used
- `GET /{order_id}`: used
- `POST /{order_id}/fund`: used
- `POST /{order_id}/release-request`: used
- `POST /{order_id}/confirm-release`: used
- `POST /{order_id}/open-dispute`: used
- `POST /{order_id}/admin-resolve`: used

## Categories (`/api/v1/categories`)
- `GET /`: used
- `GET /{category_id}`: used (wired in admin category edit detail fetch)
- `POST /`: used
- `PUT /{category_id}`: used
- `DELETE /{category_id}`: used

## Admin (`/api/v1/admin`)
- `GET /users`: used
- `PATCH /users/{user_id}/status`: used
- `GET /listings/pending`: used
- `POST /listings/{listing_id}/approve`: used
- `POST /listings/{listing_id}/reject`: used
- `GET /orders`: used (newly added endpoint + admin orders page)

## Utils
- `GET /api/v1/utils/health-check/`: not-used

## Gaps / Follow-up
- OpenAPI schema has been regenerated from current backend source using the project backend Docker image (with required env vars) and synced to both root and frontend spec files.
- Frontend SDK has been regenerated from the synced schema; refresh path and admin orders method are now generated from spec (no manual patch needed).

## Recommended Next Technical Step
- Keep using the hardened generation flow in `scripts/generate-client.sh` (temp-file + fallback) to prevent zero-byte schema regressions.
