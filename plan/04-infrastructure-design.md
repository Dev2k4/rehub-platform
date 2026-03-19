# 🏗️ ReMarket — Thiết kế Hạ tầng Production

> **Version:** 3.0 | **Ngày cập nhật:** 2026-03-14
> **Nền tảng gốc:** full-stack-fastapi-template (Traefik + Docker Compose)
> **Mục tiêu:** Chuẩn bị sẵn toàn bộ hạ tầng để khi hoàn thành BE/FE → deploy ngay

---

## Mục lục

1. [Kiến trúc Tổng quan](#1-kiến-trúc-tổng-quan)
2. [Sơ đồ Hạ tầng](#2-sơ-đồ-hạ-tầng)
3. [Danh sách Services](#3-danh-sách-services)
4. [Docker Compose Production](#4-docker-compose-production)
5. [Docker Compose Development](#5-docker-compose-development)
6. [Dockerfile — Backend](#6-dockerfile-backend)
7. [Dockerfile — Frontend](#7-dockerfile-frontend)
8. [Biến Môi trường (.env)](#8-biến-môi-trường)
9. [Nginx Config cho Frontend](#9-nginx-frontend)
10. [PostgreSQL + PostGIS](#10-postgresql--postgis)
11. [MinIO (Object Storage)](#11-minio)
12. [Redis (Cache)](#12-redis)
13. [SSL/TLS & Domain](#13-ssltls--domain)
14. [CI/CD Pipeline](#14-cicd-pipeline)
15. [Backup & Restore](#15-backup--restore)
16. [Monitoring & Logging](#16-monitoring--logging)
17. [Security Checklist](#17-security-checklist)
18. [Thứ tự Triển khai](#18-thứ-tự-triển-khai)

---

## 1. Kiến trúc Tổng quan

```
                        Internet
                           │
                    ┌──────▼──────┐
                    │   Traefik   │  ← SSL termination (Let's Encrypt)
                    │  (Reverse   │  ← Auto HTTPS redirect
                    │   Proxy)    │  ← Rate limiting
                    └──┬───┬───┬──┘
                       │   │   │
          ┌────────────┘   │   └────────────┐
          ▼                ▼                ▼
   ┌─────────────┐  ┌──────────┐  ┌──────────────┐
   │  Frontend   │  │ Backend  │  │   Adminer    │
   │ React+Vite  │  │ FastAPI  │  │  (DB Admin)  │
   │ (Nginx)     │  │ (4 wkrs) │  │              │
   │ :80         │  │ :8000    │  │  :8080       │
   └─────────────┘  └────┬─────┘  └──────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
   ┌─────────────┐ ┌──────────┐ ┌─────────────┐
   │ PostgreSQL  │ │  Redis   │ │   MinIO     │
   │ 15 + PostGIS│ │  Cache   │ │  (S3-compat)│
   │  :5432      │ │  :6379   │ │  :9000/9001 │
   └─────────────┘ └──────────┘ └─────────────┘
```

### Tóm tắt Services (8 containers)

| #   | Service        | Image                    | Port nội bộ | Subdomain Production  |
| --- | -------------- | ------------------------ | :---------: | --------------------- |
| 1   | **Traefik**    | `traefik:3.6`            |   80, 443   | `traefik.remarket.vn` |
| 2   | **Frontend**   | Custom (Nginx)           |     80      | `remarket.vn`         |
| 3   | **Backend**    | Custom (FastAPI)         |    8000     | `api.remarket.vn`     |
| 4   | **PostgreSQL** | `postgres:15`            |    5432     | — (internal)          |
| 5   | **Redis**      | `redis:7-alpine`         |    6379     | — (internal)          |
| 6   | **MinIO**      | `minio/minio:latest`     | 9000, 9001  | `storage.remarket.vn` |
| 7   | **Adminer**    | `adminer`                |    8080     | `adminer.remarket.vn` |
| 8   | **Prestart**   | Backend image            |      —      | — (run-once)          |

---

## 2. Sơ đồ Hạ tầng

```mermaid
graph TB
    subgraph Internet
        User[User Browser / Mobile]
    end

    subgraph "VPS / Cloud Server"
        subgraph "Docker Network: traefik-public"
            Traefik[Traefik Reverse Proxy<br/>:80 :443<br/>SSL + Let's Encrypt]
            FE[Frontend<br/>React+Vite → Nginx<br/>remarket.vn]
            BE[Backend<br/>FastAPI 4 workers<br/>api.remarket.vn]
            Adminer[Adminer<br/>adminer.remarket.vn]
            MinioConsole[MinIO Console<br/>storage.remarket.vn]
        end

        subgraph "Docker Network: default (internal)"
            DB[(PostgreSQL 15<br/>+ PostGIS 3.4)]
            Redis[(Redis 7)]
            Minio[(MinIO<br/>Object Storage)]
        end
    end

    User --> Traefik
    Traefik --> FE
    Traefik --> BE
    Traefik --> Adminer
    Traefik --> MinioConsole

    BE --> DB
    BE --> Redis
    BE --> Minio
    Adminer --> DB

    style Traefik fill:#e74c3c,color:#fff
    style FE fill:#3498db,color:#fff
    style BE fill:#2ecc71,color:#fff
    style DB fill:#f39c12,color:#fff
    style Redis fill:#e67e22,color:#fff
    style Minio fill:#9b59b6,color:#fff
```

---

## 3. Danh sách Services Chi tiết

### 3.1 Traefik — Reverse Proxy

| Mục            | Chi tiết                                                 |
| -------------- | -------------------------------------------------------- |
| **Vai trò**    | Reverse proxy, SSL termination, auto HTTPS, load balance |
| **SSL**        | Let's Encrypt auto-renew (TLS Challenge)                 |
| **Routing**    | Label-based: mỗi service tự khai báo subdomain           |
| **Dashboard**  | `traefik.remarket.vn` (Basic Auth bảo vệ)                |
| **Middleware** | HTTPS redirect, rate limit, CORS headers                 |

### 3.2 Frontend — React + Vite + Nginx

| Mục           | Chi tiết                                                 |
| ------------- | -------------------------------------------------------- |
| **Build**     | Multi-stage: Node build → Nginx serve static             |
| **Domain**    | `remarket.vn` (root domain)                              |
| **SPA**       | Nginx `try_files` → `index.html` cho client-side routing |
| **API Proxy** | FE gọi `api.remarket.vn` trực tiếp (CORS)                |

### 3.3 Backend — FastAPI

| Mục             | Chi tiết                                   |
| --------------- | ------------------------------------------ |
| **Workers**     | 4 Uvicorn workers (production)             |
| **Domain**      | `api.remarket.vn`                          |
| **Healthcheck** | `GET /api/v1/utils/health-check/`          |
| **Prestart**    | Chạy migration + seed data trước khi start |

### 3.4 PostgreSQL

| Mục        | Chi tiết                                              |
| ---------- | ----------------------------------------------------- |
| **Image**  | `postgres:15`                                         |
| **Lý do**  | DB mới không cần PostGIS (không có Hyperlocal Search) |
| **Volume** | `app-db-data` (persistent)                            |
| **Expose** | Chỉ internal, KHÔNG mở port ra ngoài trong production |

### 3.5 Redis

| Mục          | Chi tiết                                                                             |
| ------------ | ------------------------------------------------------------------------------------ |
| **Dùng cho** | Cache categories, cache listing detail, rate limit counter, session store (optional) |
| **Cấu hình** | `maxmemory 256mb`, `maxmemory-policy allkeys-lru`                                    |
| **Volume**   | `redis-data` (optional, có thể ephemeral)                                            |

### 3.6 MinIO — Object Storage

| Mục          | Chi tiết                                     |
| ------------ | -------------------------------------------- |
| **Dùng cho** | Ảnh sản phẩm, ảnh avatar                     |
| **API**      | S3-compatible → dùng `boto3` hoặc `minio-py` |
| **Buckets**  | `listings`, `avatars`                        |
| **Console**  | `storage.remarket.vn` (quản lý qua web)      |
| **Volume**   | `minio-data` (persistent)                    |

---

## 4. Docker Compose Production

> File: `compose.yml` + `compose.traefik.yml`

```yaml
# compose.yml — Production
services:
  db:
    image: postgres:15
    restart: always
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 10s
      retries: 5
      start_period: 30s
      timeout: 10s
    volumes:
      - app-db-data:/var/lib/postgresql/data/pgdata
    env_file:
      - .env
    environment:
      - PGDATA=/var/lib/postgresql/data/pgdata
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD?Variable not set}
      - POSTGRES_USER=${POSTGRES_USER?Variable not set}
      - POSTGRES_DB=${POSTGRES_DB?Variable not set}

  redis:
    image: redis:7-alpine
    restart: always
    command: >
      redis-server
      --maxmemory 256mb
      --maxmemory-policy allkeys-lru
      --appendonly yes
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3
    volumes:
      - redis-data:/data

  minio:
    image: minio/minio:latest
    restart: always
    command: server /data --console-address ":9001"
    environment:
      - MINIO_ROOT_USER=${MINIO_ROOT_USER:-minioadmin}
      - MINIO_ROOT_PASSWORD=${MINIO_ROOT_PASSWORD?Variable not set}
    volumes:
      - minio-data:/data
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 10s
      timeout: 5s
      retries: 3
    networks:
      - traefik-public
      - default
    labels:
      - traefik.enable=true
      - traefik.docker.network=traefik-public
      - traefik.constraint-label=traefik-public
      # MinIO Console
      - traefik.http.routers.${STACK_NAME}-minio-https.rule=Host(`storage.${DOMAIN}`)
      - traefik.http.routers.${STACK_NAME}-minio-https.entrypoints=https
      - traefik.http.routers.${STACK_NAME}-minio-https.tls=true
      - traefik.http.routers.${STACK_NAME}-minio-https.tls.certresolver=le
      - traefik.http.services.${STACK_NAME}-minio.loadbalancer.server.port=9001
      # MinIO API (for direct upload)
      - traefik.http.routers.${STACK_NAME}-minio-api-https.rule=Host(`s3.${DOMAIN}`)
      - traefik.http.routers.${STACK_NAME}-minio-api-https.entrypoints=https
      - traefik.http.routers.${STACK_NAME}-minio-api-https.tls=true
      - traefik.http.routers.${STACK_NAME}-minio-api-https.tls.certresolver=le
      - traefik.http.services.${STACK_NAME}-minio-api.loadbalancer.server.port=9000

  adminer:
    image: adminer
    restart: always
    networks:
      - traefik-public
      - default
    depends_on:
      - db
    environment:
      - ADMINER_DESIGN=pepa-linha-dark
    labels:
      - traefik.enable=true
      - traefik.docker.network=traefik-public
      - traefik.constraint-label=traefik-public
      - traefik.http.routers.${STACK_NAME}-adminer-https.rule=Host(`adminer.${DOMAIN}`)
      - traefik.http.routers.${STACK_NAME}-adminer-https.entrypoints=https
      - traefik.http.routers.${STACK_NAME}-adminer-https.tls=true
      - traefik.http.routers.${STACK_NAME}-adminer-https.tls.certresolver=le
      - traefik.http.services.${STACK_NAME}-adminer.loadbalancer.server.port=8080
      - traefik.http.routers.${STACK_NAME}-adminer-http.rule=Host(`adminer.${DOMAIN}`)
      - traefik.http.routers.${STACK_NAME}-adminer-http.entrypoints=http
      - traefik.http.routers.${STACK_NAME}-adminer-http.middlewares=https-redirect

  prestart:
    image: "${DOCKER_IMAGE_BACKEND}:${TAG-latest}"
    build:
      context: .
      dockerfile: Dockerfile
    networks:
      - default
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
    command: bash scripts/prestart.sh
    env_file:
      - .env
    environment:
      - POSTGRES_SERVER=db
      - REDIS_URL=redis://redis:6379/0
      - MINIO_ENDPOINT=minio:9000

  backend:
    image: "${DOCKER_IMAGE_BACKEND}:${TAG-latest}"
    restart: always
    networks:
      - traefik-public
      - default
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy
      prestart:
        condition: service_completed_successfully
    env_file:
      - .env
    environment:
      - POSTGRES_SERVER=db
      - REDIS_URL=redis://redis:6379/0
      - MINIO_ENDPOINT=minio:9000
      - MINIO_ACCESS_KEY=${MINIO_ROOT_USER:-minioadmin}
      - MINIO_SECRET_KEY=${MINIO_ROOT_PASSWORD}
    healthcheck:
      test:
        [
          "CMD",
          "curl",
          "-f",
          "http://localhost:8000/api/v1/utils/health-check/",
        ]
      interval: 10s
      timeout: 5s
      retries: 5
    build:
      context: .
      dockerfile: Dockerfile
    labels:
      - traefik.enable=true
      - traefik.docker.network=traefik-public
      - traefik.constraint-label=traefik-public
      - traefik.http.services.${STACK_NAME}-backend.loadbalancer.server.port=8000
      - traefik.http.routers.${STACK_NAME}-backend-http.rule=Host(`api.${DOMAIN}`)
      - traefik.http.routers.${STACK_NAME}-backend-http.entrypoints=http
      - traefik.http.routers.${STACK_NAME}-backend-http.middlewares=https-redirect
      - traefik.http.routers.${STACK_NAME}-backend-https.rule=Host(`api.${DOMAIN}`)
      - traefik.http.routers.${STACK_NAME}-backend-https.entrypoints=https
      - traefik.http.routers.${STACK_NAME}-backend-https.tls=true
      - traefik.http.routers.${STACK_NAME}-backend-https.tls.certresolver=le

  frontend:
    image: "${DOCKER_IMAGE_FRONTEND}:${TAG-latest}"
    restart: always
    networks:
      - traefik-public
      - default
    build:
      context: ./frontend
      dockerfile: Dockerfile
      args:
        - VITE_API_URL=https://api.${DOMAIN}
    labels:
      - traefik.enable=true
      - traefik.docker.network=traefik-public
      - traefik.constraint-label=traefik-public
      - traefik.http.services.${STACK_NAME}-frontend.loadbalancer.server.port=80
      - traefik.http.routers.${STACK_NAME}-frontend-http.rule=Host(`${DOMAIN}`)
      - traefik.http.routers.${STACK_NAME}-frontend-http.entrypoints=http
      - traefik.http.routers.${STACK_NAME}-frontend-http.middlewares=https-redirect
      - traefik.http.routers.${STACK_NAME}-frontend-https.rule=Host(`${DOMAIN}`)
      - traefik.http.routers.${STACK_NAME}-frontend-https.entrypoints=https
      - traefik.http.routers.${STACK_NAME}-frontend-https.tls=true
      - traefik.http.routers.${STACK_NAME}-frontend-https.tls.certresolver=le

volumes:
  app-db-data:
  redis-data:
  minio-data:

networks:
  traefik-public:
    external: true
```

---

## 5. Docker Compose Development

> File: `compose.override.yml` — auto-merge khi chạy `docker compose up`

```yaml
# compose.override.yml — Development overrides
services:
  proxy:
    image: traefik:3.6
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    ports:
      - "80:80"
      - "8090:8080"
    command:
      - --providers.docker
      - --providers.docker.constraints=Label(`traefik.constraint-label`, `traefik-public`)
      - --providers.docker.exposedbydefault=false
      - --entrypoints.http.address=:80
      - --entrypoints.https.address=:443
      - --accesslog
      - --log
      - --log.level=DEBUG
      - --api
      - --api.insecure=true
    labels:
      - traefik.enable=true
      - traefik.constraint-label=traefik-public
      - traefik.http.middlewares.https-redirect.contenttype.autodetect=false
    networks:
      - traefik-public
      - default

  db:
    restart: "no"
    ports:
      - "5432:5432"

  redis:
    restart: "no"
    ports:
      - "6379:6379"

  minio:
    restart: "no"
    ports:
      - "9000:9000"
      - "9001:9001"

  adminer:
    restart: "no"
    ports:
      - "8080:8080"

  backend:
    restart: "no"
    ports:
      - "8000:8000"
    command:
      - fastapi
      - run
      - --reload
      - "app/main.py"
    develop:
      watch:
        - path: ./app
          action: sync
          target: /app/app
          ignore:
            - .venv
        - path: ./pyproject.toml
          action: rebuild
    volumes:
      - ./uploads:/app/uploads

  frontend:
    restart: "no"
    ports:
      - "5173:5173"
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    volumes:
      - ./frontend/src:/app/src
    command: npm run dev -- --host

networks:
  traefik-public:
    external: false
```

---

## 6. Dockerfile — Backend

```dockerfile
# Dockerfile (Backend — đã có sẵn, cần bổ sung)
FROM python:3.10

ENV PYTHONUNBUFFERED=1

# Install uv
COPY --from=ghcr.io/astral-sh/uv:0.9.26 /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1
ENV UV_LINK_MODE=copy

WORKDIR /app/

ENV PATH="/app/.venv/bin:$PATH"

# Install dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-install-workspace --package app

COPY ./scripts /app/scripts
COPY ./pyproject.toml ./alembic.ini /app/
COPY ./app /app/app

RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --package app

# Tạo thư mục uploads (fallback local)
RUN mkdir -p /app/uploads

CMD ["fastapi", "run", "--workers", "4", "app/main.py"]
```

**Dependencies cần thêm vào `pyproject.toml`:**

```toml
# Thêm vào [project] dependencies:
"redis[hiredis]>=5.0.0",  # Redis client
"minio>=7.2.0",           # MinIO/S3 client
"python-slugify>=8.0.0",  # Slug generation (optional)
```

---

## 7. Dockerfile — Frontend

```dockerfile
# frontend/Dockerfile — Multi-stage build
# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Stage 2: Serve
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```dockerfile
# frontend/Dockerfile.dev — Development
FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
```

---

## 8. Biến Môi trường

### `.env.production` (Template)

```bash
# ============================================
# ReMarket — Production Environment Variables
# ============================================

# === Domain & Stack ===
DOMAIN=remarket.vn
FRONTEND_HOST=https://remarket.vn
ENVIRONMENT=production
PROJECT_NAME="ReMarket"
STACK_NAME=remarket

# === Backend ===
BACKEND_CORS_ORIGINS="https://remarket.vn,https://www.remarket.vn"
SECRET_KEY=<generate-64-char-random-string>
FIRST_SUPERUSER=admin@remarket.vn
FIRST_SUPERUSER_PASSWORD=<strong-password>

# === PostgreSQL ===
POSTGRES_SERVER=db
POSTGRES_PORT=5432
POSTGRES_DB=remarket
POSTGRES_USER=remarket_user
POSTGRES_PASSWORD=<strong-db-password>

# === Redis ===
REDIS_URL=redis://redis:6379/0

# === MinIO ===
MINIO_ENDPOINT=minio:9000
MINIO_ROOT_USER=remarket_minio
MINIO_ROOT_PASSWORD=<strong-minio-password>
MINIO_USE_SSL=false
MINIO_BUCKET_LISTINGS=listings
MINIO_BUCKET_AVATARS=avatars
MINIO_PUBLIC_URL=https://s3.remarket.vn

# === Docker Images ===
DOCKER_IMAGE_BACKEND=remarket-backend
DOCKER_IMAGE_FRONTEND=remarket-frontend
TAG=latest

# === Traefik ===
EMAIL=admin@remarket.vn
USERNAME=admin
HASHED_PASSWORD=<htpasswd-hash>

# === Payment (để sau) ===
VNPAY_TMN_CODE=
VNPAY_HASH_SECRET=
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=https://remarket.vn/payment/callback

# === Sentry (optional) ===
SENTRY_DSN=

# === SMTP ===
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_TLS=true
EMAILS_FROM_EMAIL=noreply@remarket.vn

# === Upload ===
UPLOAD_DIR=./uploads
MAX_FILE_SIZE_MB=10

# === JWT ===
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### Generate secrets:

```bash
# Generate SECRET_KEY
openssl rand -hex 32

# Generate HASHED_PASSWORD cho Traefik dashboard
htpasswd -nb admin your-password | sed -e s/\\$/\\$\\$/g
```

---

## 9. Nginx Frontend Config

```nginx
# frontend/nginx.conf
server {
    listen 80;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # SPA: mọi route → index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Không cache HTML (SPA index)
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;
    gzip_min_length 256;
}
```

---

## 10. PostgreSQL

### Init Script (auto-run khi container tạo lần đầu)

```sql
-- scripts/init-db.sql (mount vào /docker-entrypoint-initdb.d/)
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- cho fuzzy search (optional)
```

**Trong compose.yml, thêm volume mount cho db (nếu cần init script):**

```yaml
db:
  volumes:
    - app-db-data:/var/lib/postgresql/data/pgdata
    - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql
```

### PostgreSQL Tuning (production)

```ini
# Cho VPS 4GB RAM, thêm vào compose db environment hoặc postgresql.conf
shared_buffers = 1GB
effective_cache_size = 3GB
work_mem = 16MB
maintenance_work_mem = 256MB
max_connections = 100
```

---

## 11. MinIO

### Khởi tạo Buckets

```bash
# scripts/init-minio.sh — Chạy 1 lần sau khi MinIO start
#!/bin/bash
mc alias set remarket http://minio:9000 ${MINIO_ROOT_USER} ${MINIO_ROOT_PASSWORD}

# Tạo buckets
mc mb remarket/listings --ignore-existing
mc mb remarket/avatars --ignore-existing

# Set policy public cho listings + avatars (ảnh sản phẩm cần public read)
mc anonymous set download remarket/listings
mc anonymous set download remarket/avatars

echo "MinIO buckets initialized!"
```

### Python MinIO Client (trong BE)

```python
# app/core/storage.py
from minio import Minio
from app.core.config import settings

minio_client = Minio(
    endpoint=settings.MINIO_ENDPOINT,
    access_key=settings.MINIO_ACCESS_KEY,
    secret_key=settings.MINIO_SECRET_KEY,
    secure=settings.MINIO_USE_SSL,
)

async def upload_file(bucket: str, file_name: str, file_data, content_type: str) -> str:
    minio_client.put_object(bucket, file_name, file_data, length=-1,
                            part_size=10*1024*1024, content_type=content_type)
    return f"{settings.MINIO_PUBLIC_URL}/{bucket}/{file_name}"

async def delete_file(bucket: str, file_name: str):
    minio_client.remove_object(bucket, file_name)
```

---

## 12. Redis

### Python Redis Client

```python
# app/core/cache.py
import redis.asyncio as redis
from app.core.config import settings

redis_client = redis.from_url(settings.REDIS_URL, decode_responses=True)

async def cache_get(key: str) -> str | None:
    return await redis_client.get(key)

async def cache_set(key: str, value: str, ttl: int = 300):
    await redis_client.set(key, value, ex=ttl)

async def cache_delete(key: str):
    await redis_client.delete(key)
```

### Cache Strategy

| Data                | Key Pattern                    |  TTL  | Invalidate khi      |
| ------------------- | ------------------------------ | :---: | ------------------- |
| Categories tree     | `categories:tree`              |  24h  | Admin CRUD category |
| Listing detail      | `listing:{id}`                 | 5min  | Update listing      |
| User public profile | `user:profile:{id}`            | 10min | Update profile      |
| Price suggestion    | `price:{category}:{condition}` |  1h   | New order completed |
| Notification count  | `notif:unread:{user_id}`       | 1min  | New notification    |

---

## 13. SSL/TLS & Domain

### DNS Setup (Cloudflare / Namecheap / etc.)

| Record | Name                  | Value      |         Proxy          |
| ------ | --------------------- | ---------- | :--------------------: |
| A      | `remarket.vn`         | `<VPS_IP>` | ❌ (Traefik xử lý SSL) |
| A      | `api.remarket.vn`     | `<VPS_IP>` |           ❌           |
| A      | `adminer.remarket.vn` | `<VPS_IP>` |           ❌           |
| A      | `storage.remarket.vn` | `<VPS_IP>` |           ❌           |
| A      | `s3.remarket.vn`      | `<VPS_IP>` |           ❌           |
| A      | `traefik.remarket.vn` | `<VPS_IP>` |           ❌           |

> [!IMPORTANT]
> Nếu dùng Cloudflare, tắt Proxy (chuyển sang DNS Only) vì Traefik đã xử lý SSL.
> Hoặc set Cloudflare SSL = Full (Strict) nếu muốn double proxy.

---

## 14. CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy ReMarket

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.10"
      - name: Install dependencies
        run: pip install uv && uv sync
      - name: Run tests
        run: uv run pytest tests/ -v
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to VPS
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd /opt/remarket
            git pull origin main
            docker compose -f compose.yml -f compose.traefik.yml build
            docker compose -f compose.yml -f compose.traefik.yml up -d
            docker compose -f compose.yml -f compose.traefik.yml exec -T backend alembic upgrade head
            echo "✅ Deployed successfully!"
```

---

## 15. Backup & Restore

### Database Backup Script

```bash
#!/bin/bash
# scripts/backup-db.sh — Chạy bằng cron hàng ngày
BACKUP_DIR="/opt/remarket/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/remarket_$TIMESTAMP.sql.gz"

mkdir -p $BACKUP_DIR

# Dump & compress
docker compose exec -T db pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} | gzip > $BACKUP_FILE

# Giữ 7 ngày gần nhất
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup: $BACKUP_FILE ($(du -h $BACKUP_FILE | cut -f1))"
```

### Crontab

```bash
# crontab -e
0 2 * * * /opt/remarket/scripts/backup-db.sh >> /var/log/remarket-backup.log 2>&1
```

### Restore

```bash
# Restore từ backup
gunzip < backups/remarket_20260311.sql.gz | docker compose exec -T db psql -U remarket_user remarket
```

---

## 16. Monitoring & Logging

### Health Checks (đã có trong compose)

| Service    | Check                | Interval |
| ---------- | -------------------- | -------- |
| PostgreSQL | `pg_isready`         | 10s      |
| Redis      | `redis-cli ping`     | 10s      |
| MinIO      | `mc ready local`     | 10s      |
| Backend    | `curl /health-check` | 10s      |

### Logging

```bash
# Xem logs realtime
docker compose logs -f backend

# Xem logs 1 service, 100 dòng gần nhất
docker compose logs --tail=100 backend

# Lưu logs ra file (production)
docker compose logs --no-color backend > /var/log/remarket-backend.log
```

### Sentry (Error Tracking)

```python
# app/main.py — Đã có sẵn trong template
import sentry_sdk
if settings.SENTRY_DSN:
    sentry_sdk.init(dsn=settings.SENTRY_DSN, traces_sample_rate=0.1)
```

---

## 17. Security Checklist

| #   | Hạng mục                     | Cách thực hiện                        | ✅  |
| --- | ---------------------------- | ------------------------------------- | :-: |
| 1   | **HTTPS everywhere**         | Traefik + Let's Encrypt auto          |  ☐  |
| 2   | **DB không expose ra ngoài** | Chỉ internal network                  |  ☐  |
| 3   | **Redis không expose**       | Chỉ internal network                  |  ☐  |
| 4   | **MinIO credentials**        | Strong password, không dùng default   |  ☐  |
| 5   | **SECRET_KEY**               | Random 64 chars, không commit vào git |  ☐  |
| 6   | **Password hashing**         | bcrypt (`passlib[bcrypt]`)            |  ☐  |
| 7   | **JWT token**                | Access 30min, Refresh 7d + rotation   |  ☐  |
| 8   | **CORS**                     | Chỉ allow domain production           |  ☐  |
| 9   | **Rate limiting**            | Traefik middleware (100 req/s per IP) |  ☐  |
| 10  | **SQL Injection**            | SQLAlchemy parameterized queries      |  ☐  |
| 11  | **File upload**              | Validate type + size (max 10MB)       |  ☐  |
| 12  | **Adminer protect**          | Chỉ truy cập qua Traefik Basic Auth   |  ☐  |
| 13  | **.env không commit**        | Đã có trong .gitignore                |  ☐  |
| 14  | **Backup hàng ngày**         | Cron pg_dump                          |  ☐  |

---

## 18. Thứ tự Triển khai

### Phase 0: Chuẩn bị VPS (1 lần)

```bash
# 1. Mua VPS (khuyến nghị: 4 vCPU, 8GB RAM, 80GB SSD)
#    Provider: DigitalOcean / Vultr / Linode / VNG Cloud (VN)

# 2. SSH vào VPS
ssh root@<VPS_IP>

# 3. Cài Docker + Docker Compose
curl -fsSL https://get.docker.com | sh
apt install -y docker-compose-plugin

# 4. Tạo Docker network
docker network create traefik-public

# 5. Clone repo
mkdir -p /opt/remarket && cd /opt/remarket
git clone <repo-url> .

# 6. Copy .env.production → .env
cp .env.production .env
# Edit .env với giá trị thật

# 7. Khởi động Traefik (1 lần)
docker compose -f compose.traefik.yml up -d

# 8. Khởi động toàn bộ services
docker compose up -d

# 9. Init MinIO buckets
docker compose exec backend bash scripts/init-minio.sh

# 10. Setup backup cron
crontab -e
# Thêm: 0 2 * * * /opt/remarket/scripts/backup-db.sh
```

### Phase 1: Khi BE code xong

```bash
# Build + deploy backend
docker compose build backend prestart
docker compose up -d
# Migration tự chạy qua prestart container
```

### Phase 2: Khi FE code xong

```bash
# Build + deploy frontend
docker compose build frontend
docker compose up -d frontend
```

### Phase 3: Khi tích hợp MinIO

```bash
# Chuyển từ local upload → MinIO
# Chỉ cần đổi hàm upload trong service layer
# Chạy script migrate ảnh cũ (nếu có)
```

---

## Tóm tắt Hệ thống File cần tạo/sửa

| File                           |  Trạng thái   | Mục đích                                |
| ------------------------------ | :-----------: | --------------------------------------- |
| `compose.yml`                  |    🔄 Sửa     | Thêm redis, minio, frontend, dùng postgres:15 |
| `compose.override.yml`         |    🔄 Sửa     | Thêm redis, minio, frontend dev         |
| `compose.traefik.yml`          | ✅ Giữ nguyên | Traefik reverse proxy                   |
| `Dockerfile`                   |  🔄 Sửa nhẹ   | Thêm mkdir uploads                      |
| `frontend/Dockerfile`          |  🆕 Tạo mới   | Multi-stage build (Node → Nginx)        |
| `frontend/Dockerfile.dev`      |  🆕 Tạo mới   | Dev mode with hot reload                |
| `frontend/nginx.conf`          |  🆕 Tạo mới   | SPA routing + caching                   |
| `.env.production`              |  🆕 Tạo mới   | Template biến môi trường production     |
| `.dockerignore`                |    🔄 Sửa     | Thêm frontend/node_modules              |
| `scripts/init-minio.sh`        |  🆕 Tạo mới   | Tạo MinIO buckets (listings, avatars)   |
| `scripts/backup-db.sh`         |  🆕 Tạo mới   | Backup database hàng ngày               |
| `.github/workflows/deploy.yml` |  🆕 Tạo mới   | CI/CD pipeline                          |
| `app/core/storage.py`          |  🆕 Tạo mới   | MinIO client helper                     |
| `app/core/cache.py`            |  🆕 Tạo mới   | Redis client helper                     |

---

> **Tài liệu liên quan:**
>
> - `01-database-design.md` — Thiết kế Database
> - `02-module-design.md` — Thiết kế Module
> - `03-implementation-order.md` — Thứ tự thi công BE/FE
