# Task Tracker — Phase 1 BukuPay Clone MVP

## Komponen 1: Project Setup & Infrastructure
- [x] Inisialisasi monorepo root (`package.json` dengan npm workspaces)
- [x] Setup `.env.example`
- [x] Setup `docker-compose.yml` (PostgreSQL 15 + Redis 7)
- [x] Setup ESLint + Prettier
- [x] Setup `.gitignore` + `README.md`

## Komponen 2: Backend API (`apps/backend`)
- [x] Init Express.js project
- [x] Setup Prisma + schema database
- [x] Config files (db, redis, firebase, xendit)
- [x] Middlewares (auth, rateLimit, errorHandler)
- [x] Module: Auth (OTP service, JWT, refresh token)
- [x] Module: KYC (Verihubs integration)
- [x] Module: Merchant (store, profile)
- [x] Module: QRIS (generate QR, Xendit)
- [x] Module: Transaction (list, detail)
- [x] Module: Settlement (balance, history, BullMQ)
- [x] Module: Notification (FCM)
- [x] Webhooks: Xendit handler
- [x] Jobs: BullMQ settlement worker

## Komponen 3: Mobile App (`apps/mobile`)
- [x] Init React Native project (Android)
- [x] Setup navigation (RootNavigator, AuthNavigator, AppNavigator)
- [x] Setup Zustand stores
- [x] Setup Axios API instance + interceptors
- [x] Screens: PhoneScreen, OtpScreen, KycScreen
- [x] Screens: HomeScreen (QR code + saldo)
- [x] Screens: TransactionList, TransactionDetail
- [x] Screens: SettlementScreen
- [x] Screens: ProfileScreen
- [x] Components: inline dalam screens (Button, Card, dll styled)

## Komponen 4: Shared Package (`packages/shared`)
- [x] Setup shared package
- [x] Constants (OTP, MDR, settlement schedule)
- [x] Validators (phone, NIK, bank account)

## Komponen 5: CI/CD
- [x] GitHub Actions: ci.yml
- [x] GitHub Actions: deploy-backend.yml
- [x] GitHub Actions: deploy-android.yml

---
✅ **Phase 1 SELESAI** — 28 Mei 2026
