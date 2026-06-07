## ============================================================
## BukuPay Clone — Makefile
## Shortcut commands untuk Docker operations
##
## Usage: make <target>
## List all targets: make help
## ============================================================

.PHONY: help up down restart logs shell-backend shell-web shell-db \
        build build-backend build-web migrate seed ps clean nuke \
        prod-up prod-down

# Default: show help
.DEFAULT_GOAL := help

# ─── Variables ────────────────────────────────────────────────
COMPOSE      := docker-compose
COMPOSE_PROD := docker-compose -f docker-compose.yml -f docker-compose.prod.yml
ENV_FILE     := .env

# ─────────────────────────────────────────────────────────────
# DEVELOPMENT
# ─────────────────────────────────────────────────────────────

help: ## Show this help message
	@echo ''
	@echo '  🐳 BukuPay Docker Commands'
	@echo ''
	@awk 'BEGIN {FS = ":.*##"} /^[a-zA-Z_-]+:.*?##/ { printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2 }' $(MAKEFILE_LIST)
	@echo ''

setup: ## First-time setup: copy .env files + generate SSL certs
	@test -f .env || (cp .env.docker.example .env && echo "✅ Created .env from .env.docker.example")
	@test -f apps/backend/.env || (cp .env.example apps/backend/.env && echo "✅ Created apps/backend/.env from .env.example")
	@test -f apps/web/.env.local || (cp apps/web/.env.local.example apps/web/.env.local && echo "✅ Created apps/web/.env.local")
	@bash docker/nginx/ssl/generate-dev-certs.sh 2>/dev/null || true
	@echo ""
	@echo "✅ Setup complete!"
	@echo "   📝 Edit apps/backend/.env with your API keys (Xendit, Firebase, etc.)"
	@echo "   🚀 Then run: make up"

up: ## Start all services (dev mode)
	@echo "🚀 Starting BukuPay services..."
	$(COMPOSE) up -d
	@echo "✅ All services started:"
	@echo "   Backend API:   http://localhost:3000"
	@echo "   Web Dashboard: http://localhost:3001"
	@echo "   Via Nginx:     http://localhost"
	@echo "   MQTT Broker:   mqtt://localhost:1883"

up-infra: ## Start only infrastructure (postgres, redis, mqtt) — for local dev without Docker app
	$(COMPOSE) up -d postgres redis mosquitto
	@echo "✅ Infrastructure ready:"
	@echo "   PostgreSQL: localhost:5432"
	@echo "   Redis:      localhost:6379"
	@echo "   MQTT:       localhost:1883"

down: ## Stop all services (keeps volumes)
	$(COMPOSE) down

restart: ## Restart all services
	$(COMPOSE) restart

restart-backend: ## Restart only backend service
	$(COMPOSE) restart backend

restart-web: ## Restart only web dashboard
	$(COMPOSE) restart web

# ─────────────────────────────────────────────────────────────
# BUILD
# ─────────────────────────────────────────────────────────────

build: ## Build all Docker images
	$(COMPOSE) build --no-cache

build-backend: ## Build only backend image
	$(COMPOSE) build --no-cache backend

build-web: ## Build only web image
	$(COMPOSE) build --no-cache web

# ─────────────────────────────────────────────────────────────
# DATABASE
# ─────────────────────────────────────────────────────────────

migrate: ## Run Prisma database migrations
	@echo "📊 Running migrations..."
	$(COMPOSE) run --rm migrate
	@echo "✅ Migrations complete"

migrate-dev: ## Create and run a new migration (development)
	$(COMPOSE) exec backend sh -c "cd apps/backend && npx prisma migrate dev"

seed: ## Seed the database with initial data
	$(COMPOSE) exec backend sh -c "cd apps/backend && node prisma/seed.js"

db-reset: ## ⚠️  Reset database (drops all data!)
	@echo "⚠️  This will DELETE all data. Press Ctrl+C to cancel..."
	@sleep 3
	$(COMPOSE) exec backend sh -c "cd apps/backend && npx prisma migrate reset --force"

db-studio: ## Open Prisma Studio (database GUI)
	$(COMPOSE) exec backend sh -c "cd apps/backend && npx prisma studio"

# ─────────────────────────────────────────────────────────────
# LOGS & DEBUGGING
# ─────────────────────────────────────────────────────────────

logs: ## Follow logs from all services
	$(COMPOSE) logs -f --tail=100

logs-backend: ## Follow backend logs
	$(COMPOSE) logs -f --tail=100 backend

logs-web: ## Follow web dashboard logs
	$(COMPOSE) logs -f --tail=100 web

logs-nginx: ## Follow nginx logs
	$(COMPOSE) logs -f --tail=100 nginx

logs-db: ## Follow postgres logs
	$(COMPOSE) logs -f --tail=50 postgres

ps: ## Show running containers status
	$(COMPOSE) ps

shell-backend: ## Open shell in backend container
	$(COMPOSE) exec backend sh

shell-web: ## Open shell in web container
	$(COMPOSE) exec web sh

shell-db: ## Open PostgreSQL shell
	$(COMPOSE) exec postgres psql -U bukupay -d bukupay

shell-redis: ## Open Redis CLI
	$(COMPOSE) exec redis redis-cli

# ─────────────────────────────────────────────────────────────
# MQTT (Soundbox)
# ─────────────────────────────────────────────────────────────

mqtt-subscribe: ## Subscribe to all MQTT topics (debug)
	$(COMPOSE) exec mosquitto mosquitto_sub -t "bukupay/#" -v -u backend -P bukupay_mqtt_change_this

mqtt-test-payment: ## Simulate payment notification to soundbox
	$(COMPOSE) exec mosquitto mosquitto_pub \
		-t "bukupay/device/TEST_DEVICE_001/payment" \
		-m '{"amount":150000,"storeName":"Toko Test","txId":"test-123"}' \
		-u backend -P bukupay_mqtt_change_this

# ─────────────────────────────────────────────────────────────
# CLEANUP
# ─────────────────────────────────────────────────────────────

clean: ## Remove stopped containers and unused images
	$(COMPOSE) down --remove-orphans
	docker image prune -f

nuke: ## ☢️  DESTROY everything (containers + volumes + images)
	@echo "☢️  This will DELETE all containers, volumes, and data!"
	@echo "Press Ctrl+C to cancel or wait 5 seconds..."
	@sleep 5
	$(COMPOSE) down -v --remove-orphans
	docker image prune -af
	@echo "🗑️  Everything removed."

# ─────────────────────────────────────────────────────────────
# PRODUCTION
# ─────────────────────────────────────────────────────────────

prod-up: ## Start production stack
	$(COMPOSE_PROD) up -d

prod-down: ## Stop production stack
	$(COMPOSE_PROD) down

prod-logs: ## Follow production logs
	$(COMPOSE_PROD) logs -f --tail=100

prod-migrate: ## Run migrations on production
	$(COMPOSE_PROD) run --rm migrate
