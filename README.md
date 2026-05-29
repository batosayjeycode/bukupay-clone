# BukuPay Clone — QRIS Payment App for UMKM Indonesia

A full-stack QRIS Soundbox payment application built for Indonesian small businesses (UMKM). Enables merchants to accept digital payments via QRIS with real-time notifications.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native 0.74 (Android-first) |
| Backend | Node.js 20 + Express.js 4 |
| Database | PostgreSQL 15 + Redis 7 |
| ORM | Prisma |
| State | Zustand (mobile) |
| Queue | BullMQ |
| Payments | Xendit (QRIS) |
| eKYC | Verihubs |
| Notifications | Firebase FCM |

## Project Structure

```
bukupay-clone/
├── apps/
│   ├── mobile/          ← React Native (Android-first)
│   └── backend/         ← Express.js REST API
├── packages/
│   └── shared/          ← Shared constants, validators, utils
├── docker/              ← Docker init scripts
├── docker-compose.yml   ← PostgreSQL + Redis (local dev)
├── .env.example         ← Environment variables template
└── README.md
```

## Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- Docker & Docker Compose
- Android Studio (for mobile development)
- Java 17+ (for Android build)

## Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/your-org/bukupay-clone.git
cd bukupay-clone

# Install all workspace dependencies
npm install
```

### 2. Setup Environment Variables

```bash
cp .env.example apps/backend/.env
# Edit apps/backend/.env with your actual credentials
```

### 3. Start Infrastructure (Docker)

```bash
# Start PostgreSQL + Redis
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 4. Setup Database

```bash
cd apps/backend

# Run Prisma migrations
npx prisma migrate dev

# (Optional) Seed initial data
npx prisma db seed
```

### 5. Start Backend

```bash
npm run dev:backend
# Backend runs at http://localhost:3000
```

### 6. Start Mobile (Android)

```bash
# Make sure Android emulator is running or device is connected
npm run dev:mobile
```

## Development

### Available Scripts (Root)

| Command | Description |
|---------|-------------|
| `npm run dev:backend` | Start backend in dev mode |
| `npm run dev:mobile` | Start React Native Metro + Android |
| `npm run lint` | Run ESLint across all packages |
| `npm run lint:fix` | Auto-fix ESLint errors |
| `npm run format` | Format with Prettier |
| `npm run test` | Run all tests |

### Environment Variables

See `.env.example` for all required environment variables. Key services required:

- **Xendit** — QRIS generation & webhook processing
- **Verihubs** — eKYC (OCR KTP + face match)
- **Meta WhatsApp Business API** — OTP delivery
- **Firebase** — Push notifications (FCM)
- **AWS S3** — KTP/selfie document storage
- **Twilio** — SMS OTP fallback

## API Documentation

Base URL: `http://localhost:3000`

### Auth Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/request-otp` | Send OTP via WhatsApp/SMS |
| POST | `/auth/verify-otp` | Verify OTP, returns JWT |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Invalidate tokens |

### KYC Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/kyc/upload-ktp` | Upload KTP photo + OCR |
| POST | `/kyc/upload-selfie` | Upload selfie + face match |
| GET | `/kyc/status` | Check KYC status |

### Merchant & QRIS Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/merchant/profile` | Merchant profile |
| POST | `/merchant/stores` | Create store |
| POST | `/qris/generate` | Generate static QRIS |
| GET | `/qris/:storeId` | Get active QR code |

### Transaction & Settlement Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/transactions` | List transactions |
| GET | `/transactions/:id` | Transaction detail |
| GET | `/settlements` | Settlement history |
| GET | `/settlements/balance` | Pending balance |

## Testing

```bash
# Unit tests
cd apps/backend && npm test

# Integration tests (requires Docker)
npm run test:integration

# Lint
npm run lint
```

## Deployment

See CI/CD pipeline in `.github/workflows/`:
- `ci.yml` — PR checks (lint, test, build)
- `deploy-backend.yml` — Deploy backend to AWS (ap-southeast-3 Jakarta)
- `deploy-android.yml` — Build APK + Firebase App Distribution

## Phase Roadmap

| Phase | Features | Timeline |
|-------|----------|----------|
| **Phase 1** ✅ | Android MVP, QRIS, KYC, Transactions, Settlement | Month 1-3 |
| Phase 2 | MQTT Soundbox, Multi-store, Instant Payout, Web Dashboard | Month 4-6 |
| Phase 3 | iOS app, Advanced analytics, API marketplace | Month 7-9 |

---

*Built for UMKM Indonesia 🇮🇩*
# bukupay-clone
