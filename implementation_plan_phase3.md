# Implementation Plan
# BukuPay Clone — Phase 3

**Versi:** 3.0  
**Tanggal:** 1 Juni 2026  
**Scope:** Phase 3 — Advanced Analytics, Katalog Produk, Open API, Loyalty, Payment Link, Business Edition (Bulan 7–9)

---

## Background

Phase 1 membangun Android MVP (QRIS, KYC, transaksi, settlement). Phase 2 menambahkan Soundbox MQTT, multi-kasir, pencairan instan, dan web dashboard. **Phase 3** mendorong BukuPay dari *payment tool* menjadi **platform bisnis UMKM** yang lengkap — dengan analitik cerdas, manajemen produk, API terbuka untuk ekosistem, dan fitur monetisasi baru.

> [!IMPORTANT]
> Phase 3 dibangun **di atas Phase 1 & 2** — tidak ada breaking changes. Semua API existing dipertahankan.

> [!NOTE]
> Estimasi: **3 bulan** (Minggu 25–36). Scope meningkat signifikan — rekomendasikan +1 Backend Engineer, +1 Data/Analytics Engineer, +1 Product Designer.

---

## Pilar Phase 3

| # | Pilar | Tagline | Priority |
|---|-------|---------|----------|
| 1 | 📊 **Advanced Analytics** | AI insights + prediksi revenue | 🔴 Tinggi |
| 2 | 📦 **Katalog Produk & Inventory** | Jual lebih dari sekadar QR | 🔴 Tinggi |
| 3 | 🔌 **Open API / Marketplace** | Buka ekosistem untuk ISV & integrator | 🟡 Sedang |
| 4 | 🎁 **Program Loyalitas** | Stamp card & poin untuk pelanggan | 🟡 Sedang |
| 5 | 🔗 **Payment Link & Invoice** | Bayar tanpa ketemu fisik | 🟡 Sedang |
| 6 | 🏢 **BukuPay Business** | Multi-entitas untuk chain/franchise | 🟢 Rendah |

---

## Struktur Monorepo — Setelah Phase 3

```
bukupay-clone/
├── apps/
│   ├── mobile/          ← React Native (Android + iOS — fully parity)
│   ├── backend/         ← Express.js REST API (extended v3)
│   ├── web/             ← Next.js 14 (extended — tambah 8 halaman baru)
│   └── firmware/        ← ESP32 firmware update (OTA support)
├── packages/
│   ├── shared/          ← Extended: loyalty, product validators
│   ├── ui/              ← [NEW] Shared React component library
│   └── analytics/       ← [NEW] Analytics engine (aggregations, ML)
├── services/
│   └── ai-insights/     ← [NEW] Python FastAPI microservice (revenue prediction)
├── docker-compose.yml   ← + ClickHouse + Kafka (optional streaming)
├── .env.example         ← + Phase 3 vars
└── README.md
```

---

## User Review Required

> [!IMPORTANT]
> **Keputusan Desain yang Perlu Dikonfirmasi** sebelum eksekusi dimulai. Lihat Open Questions di bawah.

---

## Open Questions

### 1. Advanced Analytics — AI Engine

> [!CAUTION]
> **Pilihan implementasi AI insights:**
> - **Option A**: Python FastAPI microservice (scikit-learn/Prophet) — akurat, tapi tambah infra complexity
> - **Option B**: Heuristic rules di Node.js (rule-based "hari tersibuk", "produk terlaris") — lebih simpel, deploy lebih cepat
> - **Option C**: Third-party (OpenAI API/Gemini API) untuk generate natural language insights — paling cepat, ada biaya per-call
>
> **Rekomendasi**: Option B untuk MVP Phase 3, dengan Option A/C di Phase 4

### 2. Katalog Produk — Integrasi QRIS

> [!IMPORTANT]
> **Bagaimana flow pembayaran dengan produk?**
> - **Option A**: QR statis per toko (existing) + customer pilih produk di payment page Xendit
> - **Option B**: Dynamic QR per transaksi (merchant pilih produk di app → generate QR unik)
> - **Option C**: QR per produk (sticker QR di setiap item fisik)
>
> **Rekomendasi**: Option A + B (dual mode — kasir bisa pilih produk sebelum tampilkan QR)

### 3. Open API — Model Monetisasi

> [!IMPORTANT]
> **Apakah Open API akan dimonetisasi?**
> - **Free tier**: 1.000 request/bulan gratis
> - **Paid tier**: Rp 50/request atau flat Rp 500.000/bulan
> - **Enterprise**: Custom pricing + SLA
>
> Apakah perlu billing system untuk API? Atau Phase 3 hanya untuk internal/partner terpilih?

### 4. Loyalty Program — Jenis Program

> [!NOTE]
> **Pilih model loyalty:**
> - **Stamp Card**: 10x bayar → 1 hadiah (sederhana, familiar untuk UMKM)
> - **Point System**: 1% dari nominal → poin (fleksibel, butuh lebih banyak UX)
> - **Keduanya**: merchant bisa pilih tipe (kompleks tapi powerful)
>
> **Rekomendasi**: Mulai dengan Stamp Card saja, fleksibel ke Point System di update berikutnya.

### 5. Payment Link — Expiry & Partial Payment

> [!NOTE]
> - Berapa lama payment link berlaku? (default: 24 jam, 7 hari, atau custom?)
> - Apakah payment link bisa dibayar sebagian (partial payment)?
> - Integrasi email untuk kirim invoice ke pelanggan? (butuh SendGrid/Mailgun)

### 6. BukuPay Business — Scope Phase 3

> [!WARNING]
> Multi-entitas (chain/franchise) sangat kompleks. Apakah ini masuk Phase 3 atau Phase 4?
> Jika masuk Phase 3, minimum scope yang masuk akal:
> - Satu "Organisasi" bisa punya banyak "Toko" (sudah ada via multi-store)
> - Dashboard konsolidasi revenue semua outlet
> - Transfer saldo antar outlet
>
> **Rekomendasi**: Turunkan ke Phase 4, fokus Phase 3 ke 5 pilar lainnya.

---

## Proposed Changes

---

### Komponen 1: Database Schema Extensions 🗄️

#### [MODIFY] `apps/backend/prisma/schema.prisma`

Tambah model Phase 3:

**Katalog Produk:**
```prisma
model Product {
  id          String   @id @default(cuid())
  storeId     String
  name        String
  description String?
  price       Int      // Harga dalam Rupiah (cent-free, Xendit style)
  imageUrl    String?
  sku         String?
  stock       Int?     // null = unlimited
  isActive    Boolean  @default(true)
  category    String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  store         Store @relation(fields: [storeId], references: [id])
  transactionItems TransactionItem[]
}

model TransactionItem {
  id            String   @id @default(cuid())
  transactionId String
  productId     String?  // null = item ad-hoc (tanpa produk dari katalog)
  name          String   // snapshot nama produk saat transaksi
  price         Int
  qty           Int      @default(1)
  subtotal      Int
  
  transaction Transaction @relation(fields: [transactionId], references: [id])
  product     Product?    @relation(fields: [productId], references: [id])
}
```

**Loyalty (Stamp Card):**
```prisma
model LoyaltyProgram {
  id             String  @id @default(cuid())
  storeId        String  @unique
  stampsRequired Int     @default(10)
  rewardDesc     String  // "Minuman gratis", "Diskon 20%"
  rewardValue    Int?    // nominal diskon jika tipe DISCOUNT
  type           LoyaltyType @default(STAMP)
  isActive       Boolean @default(true)
  
  store   Store @relation(fields: [storeId], references: [id])
  cards   LoyaltyCard[]
}

model LoyaltyCard {
  id          String   @id @default(cuid())
  programId   String
  customerId  String   // phone number customer (hashed)
  stamps      Int      @default(0)
  totalEarned Int      @default(0) // total stamp yang pernah dikumpulkan
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  program   LoyaltyProgram @relation(fields: [programId], references: [id])
  redeemLogs LoyaltyRedeemLog[]
  
  @@unique([programId, customerId])
}

model LoyaltyRedeemLog {
  id        String   @id @default(cuid())
  cardId    String
  stamps    Int      // berapa stamp yang dipakai
  note      String?
  redeemedAt DateTime @default(now())
  
  card LoyaltyCard @relation(fields: [cardId], references: [id])
}

enum LoyaltyType {
  STAMP
  POINT
}
```

**Payment Link & Invoice:**
```prisma
model PaymentLink {
  id          String   @id @default(cuid())
  storeId     String
  merchantId  String
  externalId  String   @unique // Xendit invoice ID
  amount      Int
  description String
  customerName  String?
  customerPhone String?
  customerEmail String?
  items       Json?    // snapshot produk
  status      PaymentLinkStatus @default(PENDING)
  expiresAt   DateTime
  paidAt      DateTime?
  paymentUrl  String   // URL dari Xendit invoice
  createdAt   DateTime @default(now())
  
  store    Store    @relation(fields: [storeId], references: [id])
  merchant Merchant @relation(fields: [merchantId], references: [id])
}

enum PaymentLinkStatus {
  PENDING
  PAID
  EXPIRED
  CANCELLED
}
```

**Open API (API Keys):**
```prisma
model ApiKey {
  id          String   @id @default(cuid())
  merchantId  String
  name        String   // "Key untuk Tokopedia integration"
  key         String   @unique // hashed
  keyPrefix   String   // prefix 8 char untuk display (bp_live_xxxx...)
  scopes      String[] // ["transactions:read", "qris:generate"]
  isActive    Boolean  @default(true)
  rateLimit   Int      @default(1000) // requests per bulan
  usageCount  Int      @default(0)
  lastUsedAt  DateTime?
  expiresAt   DateTime?
  createdAt   DateTime @default(now())
  
  merchant Merchant @relation(fields: [merchantId], references: [id])
  usageLogs ApiUsageLog[]
}

model ApiUsageLog {
  id        String   @id @default(cuid())
  apiKeyId  String
  endpoint  String
  method    String
  statusCode Int
  ipAddress String
  createdAt DateTime @default(now())
  
  apiKey ApiKey @relation(fields: [apiKeyId], references: [id])
}
```

---

### Komponen 2: Backend — Phase 3 Modules 🔧

---

#### [NEW] `apps/backend/src/modules/product/`

**`product.service.js`** — CRUD katalog produk + inventory:
```
POST /api/product/            Create product
GET  /api/product/            List by storeId (filter: category, active)
GET  /api/product/:id         Get detail
PUT  /api/product/:id         Update (name, price, stock, active)
DEL  /api/product/:id         Delete (soft delete)
POST /api/product/import      Bulk import dari CSV
GET  /api/product/categories  List all categories
```

Fitur inventory:
- Auto decrement stock saat transaksi item dicatat
- Alert stock < threshold (kirim FCM + email)
- Stock restock log

#### [NEW] `apps/backend/src/modules/loyalty/`

**`loyalty.service.js`**:
```
POST /api/loyalty/program           Create program (per store)
GET  /api/loyalty/program/:storeId  Get program config
PUT  /api/loyalty/program/:id       Update program
GET  /api/loyalty/card              Get card by customerId + storeId (QR scan)
POST /api/loyalty/add-stamp         +1 stamp saat transaksi berhasil
POST /api/loyalty/redeem            Redeem stamps → reward
GET  /api/loyalty/leaderboard       Top customers by stamps (optional)
```

Flow: saat payment webhook masuk → auto-call `addStamp()` jika ada program aktif.

#### [NEW] `apps/backend/src/modules/payment-link/`

**`payment-link.service.js`**:
```
POST /api/payment-link/create       Buat Xendit Invoice + simpan ke DB
GET  /api/payment-link/             List semua link per merchant
GET  /api/payment-link/:id          Get detail + QR code
DEL  /api/payment-link/:id          Cancel link
POST /api/payment-link/:id/resend   Kirim ulang via WhatsApp
```

Integrasi Xendit Invoice API (berbeda dari QRIS) — mendukung transfer bank + e-wallet + QRIS.

#### [NEW] `apps/backend/src/modules/api-gateway/`

**Fitur Open API:**
```
POST /api/keys/create           Generate API key
GET  /api/keys/                 List API keys
DEL  /api/keys/:id              Revoke key
GET  /api/keys/:id/usage        Usage stats

# Endpoints publik (auth: Bearer bp_live_xxx...)
GET  /v1/transactions           Sama dengan /api/transactions
POST /v1/qris/generate          Generate QRIS
GET  /v1/reports/summary        Report ringkas
POST /v1/payment-links          Create payment link
GET  /v1/webhooks               Registrasi webhook URL merchant
```

**Middleware `apiKeyAuth.middleware.js`**:
- Parse `Authorization: Bearer bp_live_xxxxx`
- Hash key → lookup DB → validate scopes + rate limit
- Increment `usageCount` dan log ke `ApiUsageLog`
- Rate limit via Redis: `INCR api:{keyId}:{month}` dengan EXPIRE 31 hari

#### [NEW] `apps/backend/src/modules/analytics/`

**`analytics.service.js`** — Advanced analytics:
```
GET /api/analytics/revenue-prediction   Prediksi pendapatan 7 hari ke depan
GET /api/analytics/top-products         Produk terlaris (volume + revenue)
GET /api/analytics/customer-retention   Repeat customer rate
GET /api/analytics/peak-hours           Jam tersibuk (heatmap data)
GET /api/analytics/category-breakdown   Revenue per kategori produk
GET /api/analytics/payment-methods      Breakdown metode pembayaran
GET /api/analytics/store-comparison     Perbandingan antar toko
GET /api/analytics/growth-rate          MoM, WoW, YoY growth
```

**Revenue Prediction** (heuristic, tanpa ML service):
- Simple moving average + seasonal adjustment (hari kerja vs weekend)
- Last 30 hari data → predict 7 hari ke depan
- Confidence interval berdasarkan standar deviasi historis

---

### Komponen 3: Mobile App — Phase 3 Screens 📱

---

#### [NEW] `apps/mobile/src/screens/product/`

**`ProductListScreen.jsx`**:
- Grid view produk aktif per toko
- Search + filter kategori
- FAB (+) untuk tambah produk
- Swipe-to-delete / toggle active

**`ProductFormScreen.jsx`**:
- Form: nama, harga, kategori, stok, foto produk (kamera/galeri → S3)
- Barcode scanner untuk isi SKU (react-native-vision-camera)

**`CartScreen.jsx`** ← **fitur baru kritis**:
- Merchant pilih produk dari katalog → cart
- Adjust qty per item
- Total otomatis terhitung
- Tap "Bayar" → generate dynamic QR untuk jumlah tersebut
- QR tampil fullscreen → customer scan

#### [NEW] `apps/mobile/src/screens/loyalty/`

**`LoyaltySetupScreen.jsx`** — owner atur program:
- Toggle aktif/nonaktif
- Set jumlah stamp (default: 10)
- Set reward (teks + nilai diskon)

**`LoyaltyCardScreen.jsx`** — customer scan phone number → tampil card:
- Jumlah stamp terkumpul (progress bar visual)
- Tombol "Tambah Stamp" (owner tap setelah transaksi)
- Riwayat stamp

#### [NEW] `apps/mobile/src/screens/payment-link/`

**`PaymentLinkListScreen.jsx`**:
- List semua payment link aktif/expired
- Status badge (PENDING/PAID/EXPIRED)
- Share link via WhatsApp langsung

**`CreatePaymentLinkScreen.jsx`**:
- Input: nominal, deskripsi, nama customer, HP customer, expiry
- Opsional: pilih produk dari katalog
- Preview → Create → tampilkan link + QR untuk dibagikan

#### [MODIFY] `apps/mobile/src/screens/home/HomeScreen.jsx`

- Tambah shortcut di home: "Buat Link Bayar", "Katalog Produk"
- Widget "Prediksi Hari Ini" berdasarkan analytics (jika ada data)
- Notif badge untuk low stock alert

#### [MODIFY] `apps/mobile/src/navigation/AppNavigator.jsx`

- Tab baru: **Produk** (tab ke-5 menggantikan urutan)
- Atau: menu "Lainnya" sebagai hub untuk fitur-fitur baru (hindari tab overload)

---

### Komponen 4: Web Dashboard — Phase 3 Pages 🌐

---

#### [NEW] `apps/web/app/dashboard/products/page.jsx`

- Data grid produk (sortable: nama, harga, stok, kategori)
- Quick edit inline (harga, stok)
- Bulk import CSV
- Export daftar produk
- Filter: low stock, inactive

#### [NEW] `apps/web/app/dashboard/analytics/page.jsx`

**Advanced Analytics Dashboard:**
- Revenue prediction chart (7 hari ke depan dengan confidence band)
- Heatmap jam x hari (payment frequency)
- Top produk (bar chart): revenue + volume
- Customer retention funnel: new vs repeat customers
- Store comparison (jika multi-toko): radar/parallel chart
- Payment method breakdown (pie chart)
- Growth metrics: MoM, WoW badges

Tech: Recharts + custom heatmap component.

#### [NEW] `apps/web/app/dashboard/payment-links/page.jsx`

- List + status payment links
- Filter: status, tanggal
- Tombol "Buat Link" → form modal
- Copy link / WhatsApp share
- QR code preview per link

#### [NEW] `apps/web/app/dashboard/loyalty/page.jsx`

- Setup program loyalitas (stamp vs point)
- Statistik: total card aktif, stamp distributed, redemption rate
- List pelanggan teratas (top stampers)
- Export daftar pelanggan

#### [NEW] `apps/web/app/developer/page.jsx` (route baru, di luar dashboard)

**Developer Portal:**
- Halaman landing untuk API marketplace
- Dokumentasi interaktif (OpenAPI/Swagger UI embedded)
- Generate API key + manage existing keys
- Usage stats per key (chart)
- Webhook management (register URL + test)
- Code examples: cURL, Node.js, Python, PHP

---

### Komponen 5: Open API Infrastructure 🔌

---

#### [NEW] `apps/backend/src/middlewares/apiKeyAuth.middleware.js`

```javascript
// Flow:
// 1. Extract Bearer token (bp_live_xxx / bp_test_xxx)
// 2. Lookup by prefix → hash → DB verify
// 3. Check scope required by route
// 4. Redis rate limit: INCR api:{keyId}:{YYYY-MM} EXPIRE 31d
// 5. Log to ApiUsageLog (async, tidak block response)
// 6. Attach req.apiKey untuk downstream use
```

#### [NEW] `apps/backend/src/routes/v1.routes.js`

Public API routes — memisahkan dari `/api/` internal:
```
/v1/transactions
/v1/qris
/v1/payment-links
/v1/reports
/v1/products
/v1/webhooks
```

#### [NEW] Webhook Delivery System

Merchant bisa register URL untuk menerima event:
- `payment.completed` — payload sama dengan Xendit webhook format
- `settlement.processed` — notifikasi pencairan
- `low_stock.alert` — produk hampir habis
- `loyalty.stamp_added` — customer dapat stamp

Implementation: BullMQ job `WebhookDeliveryWorker` → retry 3x dengan exponential backoff, signature HMAC-SHA256.

---

### Komponen 6: Analytics Infrastructure 📈

---

#### [MODIFY] `docker-compose.yml`

Opsional untuk production-grade analytics:
```yaml
# ClickHouse untuk time-series analytics (opsional)
clickhouse:
  image: clickhouse/clickhouse-server:24.3
  ports: ["8123:8123", "9000:9000"]
  volumes:
    - clickhouse_data:/var/lib/clickhouse
```

Untuk Phase 3, cukup gunakan PostgreSQL dengan `date_trunc` + materialized views (sudah proven di report module Phase 2).

#### [NEW] `apps/backend/src/jobs/analytics.worker.js`

Scheduled jobs (via `node-cron`):
- **Setiap jam** — aggregate hourly stats ke `HourlySnapshot` table
- **Setiap hari pukul 02:00** — compute daily prediction model (simpan ke Redis TTL 24h)
- **Setiap minggu** — cleanup `ApiUsageLog` > 90 hari

#### [NEW] `apps/backend/src/modules/analytics/prediction.service.js`

**Revenue Prediction Algorithm (heuristic):**
```javascript
// Input: 30 hari transaksi historis
// Output: { predictions: [{date, low, mid, high}] }
// Method:
// 1. Group by day-of-week → avg per DOW
// 2. Simple moving average (7-day window)
// 3. Apply seasonality: weekday vs weekend multiplier
// 4. Confidence: ±1 standard deviation
// 5. Cache ke Redis 6 jam (storeId:revenue_prediction)
```

---

### Komponen 7: Firmware Update — OTA Support ⚙️

---

> [!NOTE]
> Update minor ke firmware soundbox (tidak buat firmware dari scratch — sudah ada di Phase 2). Tambah fitur OTA (Over-The-Air update) agar tidak perlu recall fisik perangkat.

#### [NEW] `apps/backend/src/modules/soundbox/ota.service.js`

```
POST /api/soundbox/ota/upload       Upload firmware binary (S3)
GET  /api/soundbox/ota/latest       Device check versi terbaru
POST /api/soundbox/ota/rollout      Push update ke semua device / specific device
GET  /api/soundbox/ota/status       Status rollout
```

MQTT topic untuk OTA: `bukupay/device/{deviceId}/ota` — payload: `{version, url, checksum}`

---

### Komponen 8: iOS Full Parity 🍎

---

Phase 2 sudah setup CI/CD dan SafeAreaView fixes. Phase 3 memastikan **feature parity** iOS dengan Android:

#### Screen-by-screen checklist:

| Screen | Phase 2 Status | Phase 3 Action |
|--------|---------------|----------------|
| Auth (OTP) | ✅ Shared | Verifikasi keyboard behavior iOS |
| KYC (Camera) | ⚠️ Android only | Port react-native-vision-camera iOS |
| Home | ✅ Shared | Tambah widget analytics |
| Transactions | ✅ Shared | — |
| Settlement | ✅ Updated | — |
| Products (baru) | ❌ | Implement dari awal |
| Cart + QR | ❌ | Implement dari awal |
| Loyalty | ❌ | Implement dari awal |
| Payment Link | ❌ | Implement dari awal |
| KasirMode | ✅ Phase 2 | Verifikasi iOS |
| Soundbox | ✅ Phase 2 | Verifikasi iOS |

#### [MODIFY] `apps/mobile/src/screens/auth/KycScreen.jsx`

- Port dari Android-specific camera ke `react-native-vision-camera` dengan iOS frame processor
- iOS-specific: AVFoundation permissions (NSCameraUsageDescription, NSPhotoLibraryUsageDescription)
- Liveness detection: blink detection atau head movement (jika Verihubs support)

---

### Komponen 9: Developer Portal Web 🛠️

---

#### [NEW] `apps/web/app/developer/`

```
/developer               Landing page + fitur API
/developer/docs          Swagger UI + code examples
/developer/keys          Manage API keys
/developer/webhooks      Register + test webhook
/developer/logs          API usage logs + error logs
```

**Stack tambahan:**
- `swagger-ui-react` — embedded docs
- OpenAPI spec: `apps/backend/src/openapi.yaml` (generate dari routes)

---

### Komponen 10: Environment & Dependencies 🔧

---

#### [MODIFY] `.env.example` — Phase 3 Variables

```env
# ============================================================
# Phase 3 Variables
# ============================================================

# Analytics
ANALYTICS_CACHE_TTL=21600       # 6 jam
PREDICTION_WINDOW_DAYS=30

# Open API
API_KEY_PREFIX_LIVE=bp_live_
API_KEY_PREFIX_TEST=bp_test_
API_RATE_LIMIT_MONTHLY=1000

# Payment Link / Xendit Invoice
XENDIT_INVOICE_CALLBACK_URL=https://api.bukupay.id/webhooks/xendit-invoice
PAYMENT_LINK_DEFAULT_EXPIRY_HOURS=24

# Product / S3 (product images)
S3_PRODUCT_BUCKET=bukupay-products
PRODUCT_IMAGE_MAX_SIZE_MB=5

# Loyalty
LOYALTY_STAMP_DEFAULT=10

# Webhook Delivery
WEBHOOK_DELIVERY_TIMEOUT_MS=5000
WEBHOOK_DELIVERY_MAX_RETRIES=3

# ClickHouse (opsional — production analytics)
CLICKHOUSE_URL=
CLICKHOUSE_DB=bukupay_analytics

# Email (SendGrid — untuk invoice)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@bukupay.id

# OTA Firmware
FIRMWARE_S3_BUCKET=bukupay-firmware
```

#### [MODIFY] `apps/backend/package.json` — Phase 3 Dependencies

```json
{
  "nodemailer": "^6.9.0",        // email invoice (SendGrid transport)
  "@sendgrid/mail": "^8.1.0",    // SendGrid SDK
  "swagger-ui-express": "^5.0.0", // API docs endpoint
  "yamljs": "^0.3.0",            // load OpenAPI yaml
  "sharp": "^0.33.0",            // image resize untuk product photos
  "crypto": "built-in"           // HMAC webhook signature
}
```

---

## Verification Plan

### Automated Tests

```bash
# Unit tests baru
cd apps/backend && npm test -- --testPathPattern=product
cd apps/backend && npm test -- --testPathPattern=loyalty
cd apps/backend && npm test -- --testPathPattern=payment-link
cd apps/backend && npm test -- --testPathPattern=analytics
cd apps/backend && npm test -- --testPathPattern=api-gateway

# Integration tests
npm run test:integration -- --suite=phase3
```

### Test Scenarios

| Skenario | Expected Result |
|----------|----------------|
| Merchant buat 10 produk → kasir buat cart 3 item → customer scan QR | Transaksi tercatat dengan `TransactionItem`, stock berkurang |
| Customer phone-number scan QR toko → dapat stamp ke-10 → redeem | LoyaltyCard terupdate, RedeemLog tercatat |
| Merchant buat Payment Link → WhatsApp share ke customer → customer bayar | PaymentLink.status = PAID, webhook delivery ke merchant URL |
| Developer generate API key → hit 1001 request → ditolak | HTTP 429 Too Many Requests |
| Soundbox OTA: upload firmware baru → device check versi → download → restart | Device firmware update berhasil, versi terupdate di DB |
| iOS KYC: capture KTP → liveness selfie → submit | Verihubs callback sama seperti Android |
| Analytics prediction: 30 hari data → request prediksi | 7 hari prediksi dengan low/mid/high range |

### Kriteria Launch Phase 3

- [ ] ✅ Cart → dynamic QR → pembayaran: < 3 detik end-to-end
- [ ] ✅ Stock decrement konsisten (no race condition) — gunakan DB transaction
- [ ] ✅ API key auth: <5ms overhead per request (Redis lookup)
- [ ] ✅ Webhook delivery: retry berhasil jika endpoint target timeout
- [ ] ✅ Revenue prediction: MAE < 20% dibanding aktual (backtesting 30 hari)
- [ ] ✅ iOS feature parity: semua screen Phase 1-3 berjalan di iPhone XS+
- [ ] ✅ Developer Portal: API docs dapat diakses tanpa auth
- [ ] ✅ Payment Link: expired link menampilkan error yang jelas
- [ ] ✅ Loyalty stamp: tidak bisa double-stamp 1 transaksi
- [ ] ✅ OTA firmware: rollback otomatis jika device tidak check-in 10 menit setelah update

---

## Dependensi Eksternal Phase 3

| Service | Keperluan | Status |
|---------|-----------|--------|
| **Xendit Invoice API** | Payment Link generation | ✅ Sudah partner (extend dari QRIS) |
| **SendGrid** | Kirim invoice email ke pelanggan | ⏳ Setup baru |
| **AWS S3 (bucket baru)** | Product images + firmware OTA | ⏳ Buat bucket baru |
| **ClickHouse** | (Opsional) Analytics time-series production | ⏳ Opsional Phase 3 |
| **App Store Connect** | iOS distribution | ⏳ Butuh Apple Developer Account |

---

## Timeline Estimasi

| Minggu | Fokus | Deliverable |
|--------|-------|-------------|
| 25–26 | DB Schema + Product module | Prisma migration + CRUD produk API |
| 27–28 | Cart screen mobile + Cart-to-QR | Dynamic QR dari cart, TransactionItems |
| 29–30 | Loyalty + Payment Link backend | API loyalty + payment-link |
| 31 | Loyalty mobile screens | LoyaltySetupScreen, LoyaltyCardScreen |
| 31–32 | Payment Link mobile + web | CreatePaymentLinkScreen + web page |
| 33 | Open API / API Keys | Gateway middleware + key management |
| 33–34 | Developer Portal web | Swagger UI + webhook management |
| 34–35 | Advanced Analytics | analytics.service + web page |
| 35 | OTA Firmware | Soundbox OTA backend + MQTT |
| 36 | iOS KYC parity + QA | Full iOS feature parity + testing |

---

## Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|--------|--------|----------|
| Race condition decrement stock | Data inconsistency | Gunakan `prisma.$transaction()` + SELECT FOR UPDATE |
| Webhook delivery loop (infinite retry) | Resource exhaustion | Max 3 retry + dead letter queue |
| API key brute force | Security breach | Rate limit by IP + key hash (bcrypt/SHA-256) |
| iOS KYC camera rejection (App Store) | Delay launch | Test guideline Apple, siapkan privacy strings |
| Revenue prediction akurasi rendah | User frustration | Tampilkan sebagai "estimasi", bukan "prediksi pasti" |

---

*Dokumen ini akan diupdate setelah user feedback diterima.*
