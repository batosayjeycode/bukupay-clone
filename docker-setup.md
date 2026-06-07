# 🐳 Docker Setup Summary — BukuPay Clone

Semua service sekarang berjalan dalam container.

## Architecture

```
                    ┌─────────────────────────────────┐
                    │          NGINX (port 80/443)     │
                    │  /api/*    → backend:3000        │
                    │  /webhooks/* → backend:3000      │
                    │  /*        → web:3001            │
                    └────────────┬────────────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                  ▼
        ┌─────────┐       ┌─────────┐       ┌──────────┐
        │ backend │       │   web   │       │mosquitto │
        │  :3000  │       │  :3001  │       │  :1883   │
        └────┬────┘       └─────────┘       └──────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
┌────────┐       ┌────────┐
│postgres│       │ redis  │
│  :5432 │       │  :6379 │
└────────┘       └────────┘
```

## Files yang Dibuat

| File | Fungsi |
|---|---|
| `docker-compose.yml` | Main compose (semua service) |
| `docker-compose.prod.yml` | Production overrides (pre-built images, resource limits) |
| `apps/web/Dockerfile` | Next.js 14 multi-stage build (standalone mode) |
| `apps/web/next.config.js` | Tambah `output: 'standalone'` untuk Docker |
| `docker/nginx/nginx.conf` | Nginx main config + gzip + rate limiting |
| `docker/nginx/conf.d/bukupay.conf` | Routing rules (API/webhook/dashboard) |
| `docker/caddy/Caddyfile` | Alternatif Caddy (auto HTTPS production) |
| `Makefile` | 25+ shortcut commands (`make up`, `make logs`, dll) |
| `.dockerignore` | Exclude files dari build context |
| `.env.docker.example` | Template env vars untuk Docker |

## Quick Start

```bash
# 1. Setup (copy .env files)
make setup

# 2. Edit API keys
nano apps/backend/.env

# 3. Start semua service
make up
```

## Service URLs

| Service | URL |
|---|---|
| Web Dashboard (via nginx) | http://localhost |
| Backend API (via nginx) | http://localhost/api |
| Web langsung (bypass nginx) | http://localhost:3001 |
| Backend langsung | http://localhost:3000 |
| MQTT Broker | mqtt://localhost:1883 |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

## Makefile Commands

```bash
make setup          # First-time setup: copy .env files + SSL certs
make up             # Start semua service
make up-infra       # Start hanya infrastructure (postgres, redis, mqtt)
make down           # Stop semua service
make restart        # Restart semua service
make logs           # Follow logs semua service
make logs-backend   # Follow backend logs
make logs-web       # Follow web dashboard logs
make migrate        # Run Prisma database migrations
make seed           # Seed database
make shell-backend  # Open shell di backend container
make shell-db       # Open PostgreSQL shell
make mqtt-test-payment  # Simulate payment notification ke soundbox
make clean          # Remove stopped containers
make nuke           # ☢️  Destroy everything (containers + volumes)

# Production
make prod-up        # Start production stack (dengan docker-compose.prod.yml)
make prod-down      # Stop production stack
make prod-logs      # Follow production logs
```

## Environment Files

```bash
.env                      # Docker Compose vars (dari .env.docker.example)
apps/backend/.env         # Backend API keys (dari .env.example)
apps/web/.env.local       # Next.js vars (dari apps/web/.env.local.example)
```

## Production Deploy

```bash
# Gunakan docker-compose.prod.yml override untuk:
# - Pre-built images dari container registry
# - Resource limits (CPU/memory)
# - No exposed DB port
# - Caddy untuk auto-HTTPS (Let's Encrypt)

docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Network Isolation

| Network | Akses | Service |
|---|---|---|
| `bukupay_internal` | Container-to-container only | postgres, redis, mosquitto, backend, web |
| `bukupay_external` | Exposed ke host | nginx, backend, web, mosquitto |

> **Security note:** Database (postgres) dan Redis **tidak bisa diakses dari luar** di production — hanya bisa diakses oleh backend container via internal network.
