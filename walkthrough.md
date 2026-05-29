# Walkthrough — Phase 1 BukuPay Clone MVP

**Tanggal:** 28 Mei 2026  
**Status:** ✅ Selesai

---

## Yang Telah Dibuat

### Komponen 1: Monorepo Root

| File | Deskripsi |
|------|-----------|
| [package.json](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/package.json) | npm workspaces monorepo config |
| [.env.example](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/.env.example) | Template semua environment variables |
| [docker-compose.yml](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/docker-compose.yml) | PostgreSQL 15 + Redis 7 (local dev) |
| [.eslintrc.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/.eslintrc.js) | ESLint config monorepo |
| [.prettierrc.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/.prettierrc.js) | Prettier config |
| [.gitignore](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/.gitignore) | Gitignore |
| [README.md](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/README.md) | Dokumentasi project |

### Komponen 2: Backend API (`apps/backend`)

**Database:**
| File | Deskripsi |
|------|-----------|
| [schema.prisma](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/prisma/schema.prisma) | 8 models: User, Store, Transaction, Settlement, BankAccount, KycDocument, RefreshToken, FcmToken |
| [seed.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/prisma/seed.js) | Data seed untuk development |

**Config:**
| File | Deskripsi |
|------|-----------|
| [database.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/config/database.js) | Prisma client singleton |
| [redis.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/config/redis.js) | Redis + BullMQ connection |
| [firebase.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/config/firebase.js) | Firebase Admin SDK |
| [xendit.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/config/xendit.js) | Xendit client singleton |

**Modules:**
| Module | Service | Controller | Routes |
|--------|---------|------------|--------|
| Auth | [otp.service.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/modules/auth/otp.service.js) + [jwt.service.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/modules/auth/jwt.service.js) | [auth.controller.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/modules/auth/auth.controller.js) | [auth.routes.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/modules/auth/auth.routes.js) |
| KYC | [verihubs.service.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/modules/kyc/verihubs.service.js) + [kyc.service.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/modules/kyc/kyc.service.js) | [kyc.controller.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/modules/kyc/kyc.controller.js) | [kyc.routes.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/modules/kyc/kyc.routes.js) |
| Merchant | [merchant.controller.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/modules/merchant/merchant.controller.js) | — | [merchant.routes.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/modules/merchant/merchant.routes.js) |
| QRIS | [qris.service.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/modules/qris/qris.service.js) | [qris.controller.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/modules/qris/qris.controller.js) | [qris.routes.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/modules/qris/qris.routes.js) |
| Transaction | [transaction.service.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/modules/transaction/transaction.service.js) | [transaction.controller.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/modules/transaction/transaction.controller.js) | [transaction.routes.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/modules/transaction/transaction.routes.js) |
| Settlement | [settlement.service.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/modules/settlement/settlement.service.js) | [settlement.controller.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/modules/settlement/settlement.controller.js) | [settlement.routes.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/modules/settlement/settlement.routes.js) |
| Notification | [notification.service.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/modules/notification/notification.service.js) | — | [notification.routes.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/modules/notification/notification.routes.js) |

**Infrastructure:**
| File | Deskripsi |
|------|-----------|
| [xendit.controller.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/webhooks/xendit.controller.js) | Webhook Xendit + signature verification |
| [settlement.worker.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/jobs/settlement.worker.js) | BullMQ worker + cron scheduler 3x/hari |
| [app.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/app.js) | Express app utama |
| [server.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/src/server.js) | Server entry point + graceful shutdown |
| [Dockerfile](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/backend/Dockerfile) | Multi-stage Docker build |

### Komponen 3: Mobile App (`apps/mobile`)

| File | Deskripsi |
|------|-----------|
| [AuthNavigator.jsx](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/mobile/src/navigation/AuthNavigator.jsx) | Stack: Phone → OTP → KYC |
| [AppNavigator.jsx](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/mobile/src/navigation/AppNavigator.jsx) | Bottom tab: Home, Transaksi, Pencairan, Profil |
| [RootNavigator.jsx](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/mobile/src/navigation/RootNavigator.jsx) | Root: Auth vs App berdasarkan KYC status |
| [PhoneScreen.jsx](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/mobile/src/screens/auth/PhoneScreen.jsx) | Input nomor HP dengan validasi |
| [OtpScreen.jsx](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/mobile/src/screens/auth/OtpScreen.jsx) | 6 kotak OTP + countdown 60s + resend |
| [KycScreen.jsx](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/mobile/src/screens/auth/KycScreen.jsx) | 3-step wizard: KTP → Selfie → Success |
| [HomeScreen.jsx](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/mobile/src/screens/home/HomeScreen.jsx) | QR code + today stats + recent transactions |
| [TransactionListScreen.jsx](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/mobile/src/screens/transaction/TransactionListScreen.jsx) | List + filter status + infinite scroll |
| [TransactionDetailScreen.jsx](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/mobile/src/screens/transaction/TransactionDetailScreen.jsx) | Detail transaksi + share bukti |
| [SettlementScreen.jsx](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/mobile/src/screens/settlement/SettlementScreen.jsx) | Balance card + jadwal + riwayat |
| [ProfileScreen.jsx](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/mobile/src/screens/profile/ProfileScreen.jsx) | Profil user + KYC status + logout |
| [authStore.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/mobile/src/stores/authStore.js) | Zustand auth state |
| [merchantStore.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/mobile/src/stores/merchantStore.js) | Zustand merchant/store state |
| [transactionStore.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/apps/mobile/src/stores/transactionStore.js) | Zustand transaction state + pagination |

### Komponen 4: Shared Package

| File | Deskripsi |
|------|-----------|
| [constants.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/packages/shared/src/constants.js) | OTP, MDR rates, settlement schedule, bank codes |
| [validators.js](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/packages/shared/src/validators.js) | Phone, NIK, bank account, email, amount validators |

### Komponen 5: CI/CD

| File | Trigger | Deskripsi |
|------|---------|-----------|
| [ci.yml](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/.github/workflows/ci.yml) | PR ke main/develop | Lint + Unit test + Integration test |
| [deploy-backend.yml](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/.github/workflows/deploy-backend.yml) | Push ke main | Docker build → ECR → ECS (Jakarta) |
| [deploy-android.yml](file:///Users/sociolla/Documents/ai-helper/bukupay-clone/.github/workflows/deploy-android.yml) | Manual trigger | Gradle build → Firebase App Distribution |

---

## Cara Menjalankan

### 1. Setup
```bash
cd bukupay-clone
cp .env.example apps/backend/.env
# Edit .env sesuai credentials Anda
```

### 2. Start Infrastructure
```bash
docker-compose up -d
```

### 3. Setup Database
```bash
cd apps/backend
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Start Backend
```bash
npm run dev:backend
# API berjalan di http://localhost:3000
# Health check: http://localhost:3000/health
```

### 5. Start Mobile (Android)
```bash
# Pastikan emulator berjalan
npm run dev:mobile
```

---

## Catatan Penting

> [!WARNING]
> Sebelum bisa menggunakan fitur OTP, KYC, QRIS, dan notifikasi, Anda harus menyiapkan credentials eksternal:
> - **Xendit** — QRIS + Disbursement
> - **Verihubs** — OCR KTP + Face Match
> - **Meta WhatsApp Business API** — Pengiriman OTP
> - **Firebase** — Push Notification (FCM)
> - **AWS S3** — Storage KTP/Selfie
> - **Twilio** — SMS fallback OTP

> [!NOTE]
> Semua services memiliki **mock/graceful degradation** sehingga backend tetap bisa berjalan tanpa credentials eksernal (cocok untuk development awal).

> [!TIP]
> Untuk React Native, Anda perlu menjalankan `npx react-native init BukuPay` di dalam `apps/mobile/` untuk membuat file native (android/, ios/) yang tidak bisa dibuat tanpa environment React Native lengkap.
