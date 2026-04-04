# Rehub Platform

## DevOps Production Baseline

This repository now includes a production-oriented baseline stack with Traefik, Redis, MinIO, CI workflow, and automated PostgreSQL backups.

### Added files

- `docker-compose.prod.yml`
- `backend/Dockerfile.prod`
- `.env.production.example`
- `.github/workflows/ci.yml`
- `scripts/backup-postgres.sh`

### Quick start (production-like local run)

1. Create production environment file.

```bash
cp .env.production.example .env.production
```

2. Update required values in `.env.production`:
- `DOMAIN`
- `LETSENCRYPT_EMAIL`
- `SECRET_KEY`
- `POSTGRES_PASSWORD`
- `MINIO_ROOT_PASSWORD`

Optional but recommended:
- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT`
- `SENTRY_TRACES_SAMPLE_RATE`
- `SENTRY_TEST_TOKEN`

For local staging where ports `80/443` are already in use, set:
- `TRAEFIK_HTTP_PORT=8080`
- `TRAEFIK_HTTPS_PORT=8443`

3. Start stack.

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
```

4. Verify health.

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production ps
```

### Notes

- Backend container runs migrations on startup (`alembic upgrade head`) before serving traffic.
- Database backups are created periodically by `db-backup` service and stored in Docker volume `db-backups`.
- Aggregated readiness endpoint for infra checks is available at `/api/v1/utils/health-readiness/`.
- Traefik now applies baseline security headers and API rate limiting using env-tunable values:
	- `TRAEFIK_STS_SECONDS`
	- `TRAEFIK_API_RATE_LIMIT_AVERAGE`
	- `TRAEFIK_API_RATE_LIMIT_BURST`
- Traefik also enforces a baseline `Content-Security-Policy` response header for both web and API routers.
- `scripts/backup-postgres.sh` may need executable permission in some environments:

```bash
chmod +x scripts/backup-postgres.sh
```

## Manual Staging Deploy (GitHub Actions)

A manual deployment workflow is available at `.github/workflows/deploy-staging.yml`.

### Required GitHub repository secrets

- `STAGING_SSH_HOST`: staging server host/IP
- `STAGING_SSH_PORT`: SSH port (usually `22`)
- `STAGING_SSH_USER`: SSH username
- `STAGING_SSH_KEY`: private key for SSH auth
- `STAGING_APP_DIR`: absolute path on server where repo is deployed
- `STAGING_ENV_PRODUCTION`: full content of `.env.production`

### How to run

1. Open GitHub Actions.
2. Select `Deploy Staging` workflow.
3. Click `Run workflow` and choose:
- `ref`: branch/tag/sha to deploy
- `force_recreate`: set `true` if you want to force container recreation

The workflow will:

- Validate required secrets are present and validate critical keys inside `STAGING_ENV_PRODUCTION`.
- Fetch the selected ref on staging server.
- Write `.env.production` from `STAGING_ENV_PRODUCTION` secret.
- Run `docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build`.
- Validate readiness via `/api/v1/utils/health-readiness/`.

### First run checklist (staging)

1. Ensure server has Docker + Compose plugin and can pull private/public repo dependencies.
2. Configure all required secrets listed above.
3. Run `Deploy Staging` with `ref=main`, `force_recreate=false`.
4. Confirm workflow logs include `Staging readiness is healthy`.
5. Verify app URLs and API docs on staging domain.

## Sentry Validation

After setting `SENTRY_DSN` and `SENTRY_TEST_TOKEN` in staging env, trigger one controlled test event:

```bash
curl -X POST https://<your-domain>/api/v1/utils/sentry-test/ \
	-H "X-Sentry-Test-Token: <SENTRY_TEST_TOKEN>"
```

Expected response:
- `{ "status": "sent", "event_id": "..." }`

Then verify the event appears in Sentry Issues/Events for your staging project.
