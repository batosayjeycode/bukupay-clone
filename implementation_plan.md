# Implementation Plan
# BukuPay Clone — QRIS Payment App

**Versi:** 1.0  
**Tanggal:** 26 Mei 2026  
**Scope:** Phase 1 — MVP Android (Bulan 1–3)

---

## Background

BukuPay Clone adalah aplikasi QRIS Soundbox untuk UMKM Indonesia. Plan ini mencakup **Phase 1 MVP** yang menghasilkan:
- ✅ Android App (React Native, JavaScript)
- ✅ Backend REST API (Node.js + Express.js)
- ✅ Database (PostgreSQL + Redis)
- ✅ Integrasi Xendit (QRIS), Verihubs (eKYC), WhatsApp OTP

> [!IMPORTANT]
> Phase 1 fokus pada **Android only**. iOS, Web Dashboard, MQTT Speaker, dan Pencairan Instan dikerjakan di Phase 2+.

---

## Struktur Monorepo

```
bukupay-clone/
├── apps/
│   ├── mobile/          ← React Native (Android-first)
│   └── backend/         ← Express.js REST API
├── packages/
│   └── shared/          ← Shared constants, validators, utils
├── docker-compose.yml   ← PostgreSQL + Redis + Mosquitto (local dev)
├── .env.example
└── README.md
```

---

## Proposed Changes

---

### Komponen 1: Project Setup & Infrastructure

#### [NEW] `bukupay-clone/` — Monorepo Root

**Yang dikerjakan:**
- Inisialisasi monorepo dengan npm workspaces
- Setup Docker Compose untuk PostgreSQL 15 + Redis 7 (local dev)
- Setup `.env.example` dengan semua environment variables
- Setup ESLint + Prettier (JavaScript, tanpa TypeScript)

**Dependencies:**
```json
{
  "workspaces": ["apps/*", "packages/*"],
  "devDependencies": {
    "eslint": "^8",
    "prettier": "^3",
    "husky": "^9",
    "lint-staged": "^15"
  }
}
```

**Environment Variables:**
```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/bukupay
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=
JWT_REFRESH_SECRET=
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Xendit
XENDIT_API_KEY=
XENDIT_WEBHOOK_TOKEN=
XENDIT_CALLBACK_URL=https://api.bukupay.id/webhooks/xendit

# Verihubs
VERIHUBS_CLIENT_ID=
VERIHUBS_API_KEY=
VERIHUBS_BASE_URL=https://api.verihubs.com

# WhatsApp OTP
WA_API_URL=https://api.whatsapp.com/v1/
WA_API_KEY=
WA_PHONE_NUMBER_ID=

# SMS Fallback
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM=

# Firebase
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY=
FIREBASE_CLIENT_EMAIL=

# AWS S3 (KTP upload)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=bukupay-kyc
AWS_REGION=ap-southeast-3
```

---

### Komponen 2: Backend API (`apps/backend`)

#### [NEW] `apps/backend/` — Express.js + Prisma + PostgreSQL

**Stack:**
- Node.js 20 LTS
- Express.js 4
- Prisma ORM
- PostgreSQL 15
- Redis (ioredis) — session, OTP cache, rate limiting
- BullMQ — job queue pencairan dana
- Joi — input validation

**Struktur Folder:**
```
apps/backend/
├── src/
│   ├── config/          ← db, redis, firebase, xendit config
│   ├── middlewares/     ← auth, rateLimit, errorHandler
│   ├── modules/
│   │   ├── auth/        ← OTP, JWT, refresh token
│   │   ├── kyc/         ← Verihubs integration
│   │   ├── merchant/    ← store, profile management
│   │   ├── qris/        ← generate QR, Xendit integration
│   │   ├── transaction/ ← riwayat, detail transaksi
│   │   ├── settlement/  ← pencairan dana, jadwal
│   │   └── notification/← FCM push notification
│   ├── webhooks/        ← Xendit webhook handler
│   ├── jobs/            ← BullMQ workers (settlement)
│   ├── utils/           ← helpers, formatters
│   └── app.js
├── prisma/
│   ├── schema.prisma
│   └── migrations/
└── package.json
```

#### [NEW] `prisma/schema.prisma` — Database Schema

**Tabel utama yang dibuat di Phase 1:**

```prisma
model User {
  id            String    @id @default(uuid())
  phone         String    @unique
  email         String?
  fullName      String?
  kycStatus     KycStatus @default(PENDING)
  role          Role      @default(OWNER)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  stores        Store[]
  refreshTokens RefreshToken[]
}

enum KycStatus { PENDING SUBMITTED VERIFIED REJECTED }
enum Role     { OWNER EMPLOYEE ADMIN }

model Store {
  id           String   @id @default(uuid())
  name         String
  address      String
  city         String
  ownerId      String
  owner        User     @relation(fields: [ownerId], references: [id])
  qrisCode     String?  @unique
  xenditQrisId String?
  isActive     Boolean  @default(false)
  createdAt    DateTime @default(now())
  transactions Transaction[]
  employees    StoreEmployee[]
}

model Transaction {
  id         String   @id @default(uuid())
  storeId    String
  store      Store    @relation(fields: [storeId], references: [id])
  amount     Int      // dalam rupiah
  fee        Int      @default(0)
  netAmount  Int
  status     TxStatus
  referenceNo String? // RRN dari Xendit
  xenditId   String?  @unique
  paidAt     DateTime?
  createdAt  DateTime @default(now())
}

enum TxStatus { PENDING PAID FAILED REFUNDED }

model Settlement {
  id           String         @id @default(uuid())
  storeId      String
  amount       Int
  status       SettleStatus
  bankCode     String
  bankAccount  String
  xenditDisbId String?
  scheduledAt  DateTime
  processedAt  DateTime?
  createdAt    DateTime       @default(now())
}

enum SettleStatus { PENDING PROCESSING COMPLETED FAILED }

model BankAccount {
  id          String   @id @default(uuid())
  userId      String
  bankCode    String
  accountNo   String
  accountName String
  isPrimary   Boolean  @default(false)
  createdAt   DateTime @default(now())
}

model KycDocument {
  id          String    @id @default(uuid())
  userId      String    @unique
  ktpUrl      String
  selfieUrl   String
  nik         String?
  verihubsRef String?
  status      KycStatus @default(PENDING)
  reviewedAt  DateTime?
  createdAt   DateTime  @default(now())
}
```

#### [NEW] API Endpoints — Phase 1

```
AUTH
  POST /auth/request-otp      ← kirim OTP ke WhatsApp / SMS fallback
  POST /auth/verify-otp       ← verifikasi OTP, return JWT
  POST /auth/refresh           ← refresh access token
  POST /auth/logout

KYC
  POST /kyc/upload-ktp        ← upload foto KTP ke S3, OCR via Verihubs
  POST /kyc/upload-selfie     ← upload selfie, face-match via Verihubs
  GET  /kyc/status            ← cek status KYC merchant

MERCHANT
  GET  /merchant/profile      ← profil + status toko
  POST /merchant/stores       ← buat toko baru
  GET  /merchant/stores       ← list toko milik user
  PUT  /merchant/stores/:id   ← update data toko

QRIS
  POST /qris/generate         ← generate QRIS statis via Xendit
  GET  /qris/:storeId         ← ambil QR code aktif

TRANSACTION
  GET  /transactions          ← list transaksi (filter: storeId, date)
  GET  /transactions/:id      ← detail transaksi

SETTLEMENT
  GET  /settlements           ← riwayat pencairan
  GET  /settlements/balance   ← saldo yang belum dicairkan

WEBHOOK
  POST /webhooks/xendit       ← terima notifikasi pembayaran dari Xendit

NOTIFICATION
  POST /notification/register-token ← simpan FCM token device
```

#### [NEW] Xendit Integration — QRIS & Webhook

**Generate QRIS Statis:**
```javascript
// src/modules/qris/xendit.service.js
const Xendit = require('xendit-node');

const xendit = new Xendit({ secretKey: process.env.XENDIT_API_KEY });

async function generateStaticQris(store) {
  const qr = await xendit.QrCode.createQRCode({
    referenceId: store.id,
    type: 'STATIC',
    currency: 'IDR',
    country: 'ID',
    metadata: { storeName: store.name },
  });
  return qr;
}
```

**Webhook Handler (signature verification):**
```javascript
// src/webhooks/xendit.controller.js
function verifyXenditWebhook(req, res, next) {
  const token = req.headers['x-callback-token'];
  if (token !== process.env.XENDIT_WEBHOOK_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}

async function handlePaymentWebhook(req, res) {
  const { reference_id, amount, status, id: xenditId } = req.body;
  if (status !== 'COMPLETED') return res.status(200).end();

  // 1. Simpan transaksi ke DB
  // 2. Kirim FCM push notification ke merchant
  // 3. Publish ke MQTT speaker (Phase 2)
  await transactionService.recordPayment({ reference_id, amount, xenditId });
  await notificationService.sendPaymentNotif(reference_id, amount);

  res.status(200).json({ received: true });
}
```

#### [NEW] Verihubs eKYC Integration

```javascript
// src/modules/kyc/verihubs.service.js
async function ocrKtp(imageBase64) {
  const response = await axios.post(
    `${process.env.VERIHUBS_BASE_URL}/v1/ocr/ktp`,
    { image: imageBase64 },
    { headers: { 'client-id': process.env.VERIHUBS_CLIENT_ID,
                 'api-key': process.env.VERIHUBS_API_KEY } }
  );
  return response.data; // { nik, name, dob, address }
}

async function matchFace(ktpImageBase64, selfieBase64) {
  const response = await axios.post(
    `${process.env.VERIHUBS_BASE_URL}/v1/face-match`,
    { image1: ktpImageBase64, image2: selfieBase64 },
    { headers: { 'client-id': process.env.VERIHUBS_CLIENT_ID,
                 'api-key': process.env.VERIHUBS_API_KEY } }
  );
  const { similarity, status } = response.data;
  return { passed: similarity >= 0.8, similarity, status };
}
```

#### [NEW] OTP Service — WhatsApp + SMS Fallback

```javascript
// src/modules/auth/otp.service.js
const redis = require('../config/redis');

const OTP_TTL = 300; // 5 menit
const MAX_ATTEMPTS = 5;

async function sendOtp(phone) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redis.setex(`otp:${phone}`, OTP_TTL, otp);
  await redis.setex(`otp:attempts:${phone}`, OTP_TTL, 0);

  try {
    await sendViaWhatsApp(phone, otp);
  } catch {
    await sendViaSms(phone, otp); // SMS fallback
  }
}

async function verifyOtp(phone, code) {
  const stored = await redis.get(`otp:${phone}`);
  const attempts = await redis.get(`otp:attempts:${phone}`) || 0;

  if (parseInt(attempts) >= MAX_ATTEMPTS) throw new Error('TOO_MANY_ATTEMPTS');
  if (!stored) throw new Error('OTP_EXPIRED');
  if (stored !== code) {
    await redis.incr(`otp:attempts:${phone}`);
    throw new Error('OTP_INVALID');
  }

  await redis.del(`otp:${phone}`, `otp:attempts:${phone}`);
  return true;
}
```

#### [NEW] Settlement Job — BullMQ

```javascript
// src/jobs/settlement.worker.js
// Dijalankan 3x sehari: 10:00, 15:00, 20:00 WIB
const { Worker, Queue } = require('bullmq');

const settlementQueue = new Queue('settlement', { connection: redisConfig });

const worker = new Worker('settlement', async (job) => {
  const { storeId, amount, bankCode, bankAccount } = job.data;
  // Disbursement via Xendit
  const result = await xenditService.disburse({ storeId, amount, bankCode, bankAccount });
  await settlementService.updateStatus(job.data.settlementId, result.status);
}, { connection: redisConfig });

// Scheduler (cron)
async function scheduleSettlements() {
  const pendingSettlements = await settlementService.getPending();
  for (const s of pendingSettlements) {
    await settlementQueue.add('process', s, { attempts: 3, backoff: { type: 'exponential', delay: 5000 } });
  }
}
```

---

### Komponen 3: Mobile App (`apps/mobile`)

#### [NEW] `apps/mobile/` — React Native (Android-first, JavaScript)

**Stack:**
- React Native 0.74
- React Navigation v6 (Stack + Bottom Tab)
- Zustand (state management)
- Axios (HTTP)
- React Native Firebase (FCM)
- react-native-qrcode-svg
- react-native-image-picker (upload KTP/selfie)
- react-native-mmkv (fast local storage)

**Struktur Folder:**
```
apps/mobile/
├── android/
├── src/
│   ├── api/             ← axios instance + interceptors
│   ├── assets/          ← images, fonts, lottie animations
│   ├── components/      ← reusable UI components
│   │   ├── Button/
│   │   ├── Card/
│   │   ├── OtpInput/
│   │   └── TransactionItem/
│   ├── navigation/
│   │   ├── AuthNavigator.jsx
│   │   ├── AppNavigator.jsx
│   │   └── RootNavigator.jsx
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── PhoneScreen.jsx      ← input nomor HP
│   │   │   ├── OtpScreen.jsx        ← verifikasi OTP
│   │   │   └── KycScreen.jsx        ← upload KTP + selfie
│   │   ├── home/
│   │   │   ├── HomeScreen.jsx       ← QR code + saldo
│   │   │   └── TransactionList.jsx
│   │   ├── transaction/
│   │   │   └── TransactionDetail.jsx
│   │   ├── settlement/
│   │   │   └── SettlementScreen.jsx
│   │   └── profile/
│   │       └── ProfileScreen.jsx
│   ├── stores/          ← Zustand state stores
│   │   ├── authStore.js
│   │   ├── transactionStore.js
│   │   └── merchantStore.js
│   ├── hooks/           ← custom hooks
│   ├── utils/
│   └── App.jsx
└── package.json
```

#### [NEW] Navigasi & Alur Layar

```
RootNavigator
  ├── AuthNavigator (belum login / belum KYC)
  │     ├── PhoneScreen     → input nomor HP
  │     ├── OtpScreen       → 6-digit OTP input
  │     └── KycScreen       → upload KTP + selfie (step wizard)
  │
  └── AppNavigator (sudah login & KYC verified)
        ├── HomeTab
        │     ├── HomeScreen        → QR code toko + ringkasan hari ini
        │     └── NotificationScreen
        ├── TransactionTab
        │     ├── TransactionList   → riwayat transaksi + filter
        │     └── TransactionDetail
        ├── SettlementTab
        │     └── SettlementScreen  → saldo + riwayat pencairan
        └── ProfileTab
              └── ProfileScreen     → profil, toko, pengaturan
```

#### [NEW] Desain UI — Komponen Utama

**HomeScreen — QR Code + Saldo:**
```jsx
// src/screens/home/HomeScreen.jsx
import QRCode from 'react-native-qrcode-svg';
import { useMerchantStore } from '../../stores/merchantStore';

export default function HomeScreen() {
  const { activeStore, todayTotal } = useMerchantStore();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.storeName}>{activeStore?.name}</Text>
        <Text style={styles.todayLabel}>Hari ini</Text>
        <Text style={styles.todayAmount}>Rp {formatCurrency(todayTotal)}</Text>
      </View>

      <View style={styles.qrContainer}>
        <QRCode
          value={activeStore?.qrisCode || 'loading'}
          size={220}
          logo={require('../../assets/logo-qris.png')}
        />
        <Text style={styles.scanHint}>Minta pelanggan scan QR ini</Text>
      </View>

      <RecentTransactions />
    </ScrollView>
  );
}
```

**OTP Input Screen:**
```jsx
// src/screens/auth/OtpScreen.jsx
// 6 kotak input digit, auto-focus, paste support
// Countdown 60 detik untuk kirim ulang OTP
// Tombol "Kirim ulang via SMS" muncul jika WhatsApp gagal
```

**Notifikasi Pembayaran (FCM in-app):**
```jsx
// Saat app foreground: tampilkan modal animasi konfirmasi
// "✅ Pembayaran masuk Rp 50.000"
// Saat app background: push notification system
```

---

### Komponen 4: Shared Package (`packages/shared`)

#### [NEW] `packages/shared/` — Constants & Validators

```javascript
// packages/shared/src/constants.js
module.exports = {
  OTP_LENGTH: 6,
  OTP_TTL_SECONDS: 300,
  MAX_OTP_ATTEMPTS: 5,
  SETTLEMENT_SCHEDULE_HOURS: [10, 15, 20], // WIB
  MIN_ACTIVE_TRANSACTION: 20000, // Rp 20.000
  DAILY_SUBSCRIPTION_FEE: 1500, // Rp 1.500
  FREE_TRIAL_DAYS: 60,
  MDR_MICRO_RATE: 0, // 0% untuk <= 500.000
  MDR_STANDARD_RATE: 0.007, // 0.7%
  MICRO_THRESHOLD: 500000, // Rp 500.000
};

// packages/shared/src/validators.js
// Phone number: +62 format
// NIK: 16 digit
// Bank account validation
```

---

### Komponen 5: CI/CD & Deployment

#### [NEW] `.github/workflows/` — GitHub Actions

**Pipeline:**
```yaml
# ci.yml — PR checks
- Lint (ESLint + Prettier)
- Unit tests (Jest)
- Integration tests (Supertest)
- Build check (React Native bundle)

# deploy-backend.yml — push to main
- Docker build + push ke ECR
- Deploy ke EC2 / ECS (region: ap-southeast-3 Jakarta)
- Run prisma migrate

# deploy-android.yml — manual trigger
- Gradle build release APK
- Upload ke Firebase App Distribution (internal testing)
- (Phase 3) Upload ke Google Play Store
```

---

## Urutan Pengerjaan

```
Minggu 1–2: Foundation
  ├── Setup monorepo + Docker Compose
  ├── Prisma schema + migrations
  ├── Express app boilerplate + middleware
  └── React Native project init (Android)

Minggu 3–4: Auth & KYC
  ├── OTP service (WhatsApp + SMS fallback)
  ├── JWT auth middleware
  ├── Verihubs OCR KTP endpoint
  ├── Verihubs face-match endpoint
  └── Mobile: PhoneScreen + OtpScreen + KycScreen

Minggu 5–6: QRIS & Transaksi
  ├── Xendit QRIS static generation
  ├── Webhook handler + signature verify
  ├── Transaction service (record, list, detail)
  ├── FCM push notification
  └── Mobile: HomeScreen + QR display + notification

Minggu 7–8: Settlement & Riwayat
  ├── BullMQ settlement scheduler (3x/hari)
  ├── Xendit disbursement integration
  ├── Settlement API endpoints
  ├── Transaction list + filter API
  └── Mobile: TransactionList + SettlementScreen

Minggu 9–10: Polish & Testing
  ├── Unit tests (Jest) — service layer
  ├── Integration tests (Supertest) — API endpoints
  ├── Error handling & logging (Morgan + Winston)
  ├── Rate limiting per endpoint
  ├── Mobile UX polish (loading states, error states)
  └── Internal UAT (Firebase App Distribution)

Minggu 11–12: Hardening & Launch Prep
  ├── Security audit (OWASP checklist)
  ├── Load testing (k6)
  ├── Docker + EC2 production setup
  ├── Monitoring setup (Grafana + Prometheus)
  └── Google Play Store submission
```

---

## Verification Plan

### Automated Tests

```bash
# Backend unit tests
cd apps/backend && npm test

# Backend integration tests (requires Docker)
npm run test:integration

# Lint check
npm run lint

# Load test (k6)
k6 run tests/load/payment-webhook.js --vus 100 --duration 60s
```

### Manual Verification

| Skenario | Expected Result |
|---|---|
| Daftar dengan nomor HP baru | OTP terkirim via WhatsApp < 10 detik |
| OTP salah 5x | Akun terkunci 15 menit |
| Upload KTP valid + selfie cocok | KYC status → VERIFIED |
| Upload selfie tidak cocok | KYC ditolak, minta ulangi |
| Scan QRIS & bayar | Webhook diterima, transaksi tersimpan, FCM push terkirim < 3 detik |
| Webhook dengan token salah | Response 401 |
| Pencairan terjadwal 10:00 WIB | Saldo berkurang, status settlement COMPLETED |
| Cek riwayat transaksi | Data terurut by waktu, filter berfungsi |

### Kriteria Launch (Phase 1 Done)
- [ ] ✅ OTP sukses via WhatsApp (< 10 detik)
- [ ] ✅ eKYC Verihubs berhasil (OCR + face match)
- [ ] ✅ QRIS aktif bisa di-scan dari semua e-wallet (GoPay, OVO, Dana, dll)
- [ ] ✅ Webhook Xendit diterima dan transaksi tersimpan
- [ ] ✅ FCM push notification terkirim saat transaksi masuk
- [ ] ✅ Settlement 3x/hari berjalan otomatis via BullMQ
- [ ] ✅ Uptime backend > 99% selama 1 minggu staging
- [ ] ✅ APK berjalan di Android 8.0+ (API level 26+)
- [ ] ✅ Zero critical security issues (OWASP checklist)

---

## Dependensi Eksternal & Akun yang Dibutuhkan

| Service | Keperluan | Status |
|---|---|---|
| **Xendit** | API Key + Webhook token + QRIS product aktif | ⏳ Perlu setup |
| **Verihubs** | Client ID + API Key (berlangganan) | ⏳ Perlu setup |
| **Meta WhatsApp Business API** | Phone number ID + API key | ⏳ Perlu setup |
| **Firebase** | Project + FCM enabled + Android app registered | ⏳ Perlu setup |
| **AWS** | S3 bucket (region: ap-southeast-3) + IAM user | ⏳ Perlu setup |
| **Twilio** (SMS fallback) | Account SID + Auth token | ⏳ Perlu setup |
| **Google Play Console** | Developer account untuk publish APK | ⏳ Perlu setup |

> [!WARNING]
> Semua akun di atas harus sudah aktif sebelum Minggu 3 agar integrasi OTP dan KYC bisa dikerjakan tepat waktu.

---

## Estimasi Waktu & Tim

| Role | Tanggung Jawab | Estimasi |
|---|---|---|
| Backend Developer | API, DB, integrasi Xendit/Verihubs/OTP | 3 bulan |
| Mobile Developer (RN) | Android app, UI, FCM, Zustand | 3 bulan |
| DevOps / Infra | Docker, EC2, CI/CD, monitoring | 2 minggu setup + on-call |
| QA | Testing manual + automation | 3 minggu |

---

*Phase 2 (MQTT Speaker, Multi-toko, Pencairan Instan, Web Dashboard) akan direncanakan setelah Phase 1 selesai.*
