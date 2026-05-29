# Implementation Plan
# BukuPay Clone — Phase 2

**Versi:** 2.0  
**Tanggal:** 28 Mei 2026  
**Scope:** Phase 2 — MQTT Soundbox, Multi-toko, Pencairan Instan, Web Dashboard, iOS (Bulan 4–6)

---

## Background

Phase 1 telah menghasilkan Android MVP dengan QRIS payment, eKYC, auth OTP, dan settlement terjadwal. **Phase 2** fokus pada 5 fitur besar yang menjadikan BukuPay lebih kompetitif:

1. 🔊 **MQTT Soundbox** — speaker pintar yang bersuara saat pembayaran masuk
2. 🏪 **Multi-toko & Multi-kasir** — satu akun mengelola banyak outlet + role karyawan
3. ⚡ **Pencairan Instan** — transfer dana dalam hitungan detik (H+0)
4. 🌐 **Web Dashboard** — portal merchant untuk laporan & manajemen (Next.js)
5. 🍎 **iOS App** — React Native universal app untuk iPhone

> [!IMPORTANT]
> Phase 2 dibangun **di atas Phase 1** — semua backend API Phase 1 dipertahankan dan diperluas. Tidak ada breaking changes pada existing mobile app.

> [!NOTE]
> Estimasi: **3 bulan** (Minggu 13–24 sejak project dimulai). Tim bertambah: +1 Frontend (Web), +1 Firmware/IoT Developer.

---

## Struktur Monorepo — Setelah Phase 2

```
bukupay-clone/
├── apps/
│   ├── mobile/          ← React Native (Android + iOS Phase 2)
│   ├── backend/         ← Express.js REST API (extended)
│   ├── web/             ← [NEW] Next.js 14 Web Dashboard
│   └── firmware/        ← [NEW] ESP32 MQTT Soundbox firmware
├── packages/
│   ├── shared/          ← Extended constants & validators
│   └── ui/              ← [NEW] Shared React components
├── docker-compose.yml   ← + Mosquitto MQTT broker
├── .env.example         ← + MQTT, Snap BI vars
└── README.md
```

---

## Open Questions

> [!IMPORTANT]
> **Pertanyaan 1 — Pencairan Instan:** Apakah menggunakan Xendit Instant Disbursement (biaya ~Rp 2.500/transfer) atau BI-FAST via bank partner (biaya lebih rendah, tapi butuh MOU)? Keputusan ini mempengaruhi margin.

> [!IMPORTANT]
> **Pertanyaan 2 — Hardware Soundbox:** Apakah hardware diproduksi sendiri (ESP32 custom PCB) atau menggunakan white-label device dari vendor China? Produksi sendiri lebih murah dalam skala besar tapi butuh waktu 4–6 minggu untuk prototyping.

> [!IMPORTANT]
> **Pertanyaan 3 — Web Dashboard Scope:** Apakah Web Dashboard perlu fitur **Admin Panel** (tim internal BukuPay melihat semua merchant) atau hanya **Merchant Portal** (setiap merchant lihat datanya sendiri) di Phase 2?

> [!WARNING]
> **Snap BI Integration:** Untuk BI-FAST dan real-time payment notification via BI, dibutuhkan sandbox approval dari Bank Indonesia. Proses ini bisa memakan waktu 4–8 minggu. Perlu segera diajukan di awal Phase 2.

---

## Proposed Changes

---

### Komponen 1: MQTT Soundbox 🔊

**Cara kerja:** Xendit webhook → backend publish ke MQTT topic → Soundbox (ESP32) subscribe → bersuara + tampil amount di layar OLED kecil.

---

#### [MODIFY] `docker-compose.yml` — Tambah Mosquitto MQTT Broker

Aktifkan service Mosquitto yang sudah di-comment di Phase 1:

```yaml
mosquitto:
  image: eclipse-mosquitto:2
  container_name: bukupay_mosquitto
  restart: unless-stopped
  ports:
    - '1883:1883'   # MQTT
    - '8883:8883'   # MQTT over TLS
    - '9001:9001'   # WebSocket
  volumes:
    - ./docker/mosquitto/mosquitto.conf:/mosquitto/config/mosquitto.conf
    - ./docker/mosquitto/passwd:/mosquitto/config/passwd
    - mosquitto_data:/mosquitto/data
```

#### [NEW] `docker/mosquitto/mosquitto.conf`

```conf
listener 1883
listener 8883
cafile /mosquitto/config/ca.crt
certfile /mosquitto/config/server.crt
keyfile /mosquitto/config/server.key
listener 9001
protocol websockets

allow_anonymous false
password_file /mosquitto/config/passwd
log_type all
persistence true
persistence_location /mosquitto/data/
```

---

#### [NEW] `apps/backend/src/config/mqtt.js`

```javascript
const mqtt = require('mqtt');

const mqttClient = mqtt.connect(process.env.MQTT_BROKER_URL, {
  username: process.env.MQTT_USERNAME,
  password: process.env.MQTT_PASSWORD,
  clientId: `bukupay-backend-${process.pid}`,
  reconnectPeriod: 5000,
});

async function publishPayment(deviceId, payload) {
  const topic = `bukupay/device/${deviceId}/payment`;
  mqttClient.publish(topic, JSON.stringify(payload), { qos: 1 });
}

module.exports = { mqttClient, publishPayment };
```

#### [NEW] `apps/backend/src/modules/soundbox/`

**New API endpoints:**
```
POST   /soundbox/register        ← daftarkan device (pairing)
GET    /soundbox/devices         ← list perangkat merchant
PUT    /soundbox/devices/:id     ← update nama/volume
DELETE /soundbox/devices/:id     ← hapus perangkat
POST   /soundbox/test/:id        ← kirim test sound
```

**New DB model:**
```prisma
model SoundboxDevice {
  id           String    @id @default(uuid())
  storeId      String
  store        Store     @relation(...)
  deviceId     String    @unique   // MAC address ESP32
  name         String              // "Kasir 1"
  firmwareVer  String?
  volume       Int       @default(80)
  isOnline     Boolean   @default(false)
  lastSeenAt   DateTime?
  mqttUser     String?             // MQTT credentials unik per device
  mqttPassHash String?
  createdAt    DateTime  @default(now())
}
```

**MQTT Topic Convention:**
```
bukupay/device/{deviceId}/payment   ← incoming payment (backend → device)
bukupay/device/{deviceId}/config    ← update volume/firmware (backend → device)
bukupay/device/{deviceId}/status    ← heartbeat (device → backend)
```

**Pairing Flow:**
1. Merchant buka app → tap "Tambah Soundbox" → scan QR di layar device
2. App kirim `POST /soundbox/register` dengan `deviceId` (MAC address dari QR)
3. Backend generate MQTT credentials unik untuk device + simpan ke DB
4. Device connect ke broker dengan credentials tersebut
5. Device publish heartbeat setiap 30 detik ke topic `status`

#### [MODIFY] `apps/backend/src/webhooks/xendit.controller.js`

Tambahkan MQTT publish setelah FCM notification:
```javascript
// Setelah notificationService.sendPaymentNotification(...)
const soundbox = await prisma.soundboxDevice.findFirst({
  where: { storeId: store.id, isOnline: true },
});
if (soundbox) {
  await mqttService.publishPayment(soundbox.deviceId, {
    amount,
    storeName: store.name,
    timestamp: Date.now(),
  });
}
```

---

#### [NEW] `apps/firmware/` — ESP32 Soundbox Firmware

**Hardware:**
- ESP32 DevKit V1 (~Rp 50.000)
- DFPlayer Mini MP3 module (~Rp 25.000)
- Speaker 3W 4Ω (~Rp 15.000)
- OLED 0.96" SSD1306 (opsional) (~Rp 20.000)
- **Total BOM: ~Rp 110.000/unit**

**Struktur:**
```
apps/firmware/
├── src/
│   ├── main.cpp          ← Entry point, WiFi + MQTT setup
│   ├── mqtt_handler.cpp  ← Subscribe, parse JSON payload
│   ├── audio_player.cpp  ← DFPlayer Mini control
│   ├── display.cpp       ← OLED: tampilkan "Rp 50.000"
│   └── ble_provision.cpp ← BLE provisioning WiFi credentials
├── sounds/               ← MP3: "pembayaran-masuk.mp3", angka 0-9
├── platformio.ini
└── README.md
```

**Flow saat payment:**
```
MQTT message diterima
  → parse: { amount: 50000, storeName: "Warung Budi" }
  → play: "pembayaran-masuk.mp3" + "lima-puluh-ribu.mp3"
  → OLED: "Rp 50.000 ✓"
  → LED blink hijau 3x
```

---

### Komponen 2: Multi-toko & Multi-kasir 🏪

Phase 1 sudah punya `StoreEmployee`. Phase 2 mengaktifkan fitur ini secara penuh.

---

#### [MODIFY] `apps/backend/prisma/schema.prisma`

```prisma
// Extend StoreEmployee
model StoreEmployee {
  // ... existing fields ...
  permissions  Json?     // { canRefund: true, canViewReport: false, canManageEmployees: false }
  pinHash      String?   // PIN 6 digit (bcrypt) untuk KasirMode
  inviteToken  String?   @unique
  inviteExpiry DateTime?
  joinedAt     DateTime?
}
```

#### [NEW] `apps/backend/src/modules/employee/`

**New API endpoints:**
```
POST   /employee/invite           ← undang karyawan (kirim WhatsApp link)
POST   /employee/join             ← karyawan accept invite
GET    /employee/list/:storeId    ← list karyawan per toko
PUT    /employee/:id/permissions  ← update permissions
PUT    /employee/:id/pin          ← set/reset PIN kasir
DELETE /employee/:id              ← hapus karyawan dari toko

POST   /employee/pin-login        ← login kasir via PIN (return short JWT)
GET    /employee/shift-summary    ← ringkasan transaksi shift kasir hari ini
```

**Invite Flow:**
```
Pemilik → POST /employee/invite { phone, storeId, permissions }
  → generate inviteToken (UUID, TTL 24 jam)
  → kirim WhatsApp: "Anda diundang jadi kasir di {storeName}.
                     Klik: https://app.bukupay.id/join/{token}"
  → Karyawan klik link → masuk app
  → POST /employee/join { token }
  → Dibuat akun dengan role EMPLOYEE + StoreEmployee record
```

#### [NEW] Mobile Screens Baru

```
screens/employee/
├── InviteEmployeeScreen.jsx   ← form: nomor HP + pilih toko + permissions
├── EmployeeListScreen.jsx     ← list karyawan + toggle permissions + hapus
└── KasirModeScreen.jsx        ← QR display minimalis, login PIN 6 digit
```

**KasirModeScreen** — tampilan minimal untuk karyawan:
- Tampilkan QR code toko aktif
- Tidak bisa akses laporan, settlement, atau pengaturan
- Login dengan PIN 6 digit (bukan OTP penuh)
- Session berlaku 8 jam (satu shift)

---

### Komponen 3: Pencairan Instan ⚡

Phase 1: settlement otomatis 3x/hari. Phase 2: merchant bisa cairkan kapan saja secara instan.

---

#### [NEW] Backend: Instant Disbursement Module

**New endpoints:**
```
POST /settlements/instant          ← request pencairan instan
GET  /settlements/instant/fee      ← cek biaya (Rp 2.500)
POST /settlements/bank-accounts    ← tambah rekening bank
GET  /settlements/bank-accounts    ← list rekening bank merchant
PUT  /settlements/bank-accounts/:id/primary ← set rekening utama
```

**Pricing model:**
```
Pencairan terjadwal (3x/hari): GRATIS
Pencairan instan (kapan saja):  Rp 2.500/transfer
Syarat minimum:                 Rp 50.000
```

**`instant-settlement.service.js`:**
```javascript
async function requestInstantSettlement(userId, storeId, amount, bankAccountId) {
  const INSTANT_FEE = parseInt(process.env.INSTANT_SETTLEMENT_FEE) || 2500;
  const MIN_AMOUNT = 50000;

  if (amount < MIN_AMOUNT) throw new Error('AMOUNT_TOO_SMALL');

  // Cek saldo tersedia
  const balance = await settlementService.getPendingBalance(userId);
  if (balance.availableBalance < amount + INSTANT_FEE) {
    throw new Error('INSUFFICIENT_BALANCE');
  }

  const settlement = await prisma.settlement.create({
    data: {
      storeId, amount,
      fee: INSTANT_FEE,
      netAmount: amount - INSTANT_FEE,
      status: 'PENDING',
      type: 'INSTANT',
      requestedBy: userId,
      scheduledAt: new Date(),
    },
  });

  // Queue dengan PRIORITY TINGGI — diproses segera
  await settlementQueue.add('process', { settlementId: settlement.id, ... }, {
    priority: 1,   // 1 = highest priority
    attempts: 5,
    delay: 0,
  });

  return settlement;
}
```

#### [MODIFY] `apps/backend/prisma/schema.prisma`

```prisma
model Settlement {
  // ... existing fields ...
  type         SettleType  @default(SCHEDULED)  // [NEW]
  requestedBy  String?     // userId untuk instant
}

enum SettleType { SCHEDULED INSTANT }
```

#### [MODIFY] Mobile — SettlementScreen.jsx

Tambah **"Cairkan Sekarang"** button:
```jsx
{balance.availableBalance >= 50000 && (
  <TouchableOpacity style={styles.instantButton} onPress={handleInstantSettle}>
    <Text style={styles.instantButtonText}>⚡ Cairkan Sekarang</Text>
    <Text style={styles.feeNote}>Biaya: Rp 2.500</Text>
  </TouchableOpacity>
)}
```

---

### Komponen 4: Web Dashboard 🌐

Portal web untuk laporan lebih detail di laptop/PC.

---

#### [NEW] `apps/web/` — Next.js 14

**Stack:**
- Next.js 14 (App Router)
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Recharts (grafik)
- Zustand (client state)
- Axios (HTTP ke backend)
- NextAuth.js (session — token dari BukuPay backend)

**Struktur folder:**
```
apps/web/
├── app/
│   ├── (auth)/
│   │   ├── login/page.jsx      ← input HP → OTP
│   │   └── verify/page.jsx     ← verifikasi OTP
│   └── (dashboard)/
│       ├── layout.jsx           ← sidebar + header
│       ├── page.jsx             ← overview
│       ├── transactions/        ← tabel + filter + export CSV
│       ├── settlements/         ← riwayat pencairan
│       ├── stores/              ← manajemen toko
│       ├── employees/           ← manajemen karyawan
│       ├── soundbox/            ← status perangkat
│       ├── reports/             ← laporan + chart Recharts
│       └── settings/            ← profil, bank account
├── components/
│   ├── charts/
│   │   ├── RevenueChart.jsx     ← line chart pendapatan 7/30 hari
│   │   ├── TxVolumeChart.jsx    ← bar chart volume transaksi per jam
│   │   └── SettlementChart.jsx  ← pencairan per bulan
│   └── tables/
│       ├── TransactionTable.jsx ← sortable, filterable, paginated
│       └── SettlementTable.jsx
├── lib/
│   ├── api.js                   ← axios → https://api.bukupay.id
│   └── auth.js                  ← NextAuth config (JWT dari BukuPay)
└── package.json
```

**Overview Dashboard — UI Layout:**
```
┌──────────────────────────────────────────────────────────┐
│ BukuPay Dashboard    [Warung Budi ▾]    🔔  [Budi S. ▾] │
├─────────────┬────────────────────────────────────────────┤
│ 🏠 Beranda  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐     │
│ 📋 Transaksi│  │ Rp   │ │ 34x  │ │ Rp   │ │ 2/3  │     │
│ 💰 Pencairan│  │2.45jt│ │Trx   │ │8.2jt │ │Soundb│     │
│ 📊 Laporan  │  │hari  │ │      │ │saldo │ │online│     │
│ 👥 Karyawan │  └──────┘ └──────┘ └──────┘ └──────┘     │
│ 🔊 Soundbox │                                            │
│ ⚙️ Setelan  │  [Grafik Revenue 7 Hari — Recharts]        │
└─────────────┴────────────────────────────────────────────┘
```

**New API endpoints untuk Web:**
```
GET /reports/daily?storeId=&date=
GET /reports/weekly?storeId=&week=
GET /reports/monthly?storeId=&month=
GET /reports/export?format=csv&startDate=&endDate=   ← streaming CSV
GET /reports/top-hours?storeId=&date=
```

#### [NEW] `apps/web/package.json`

```json
{
  "name": "@bukupay/web",
  "version": "1.0.0",
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "^14.2.0",
    "react": "^18.3.0",
    "axios": "^1.6.8",
    "recharts": "^2.12.0",
    "zustand": "^4.5.2",
    "next-auth": "^4.24.0",
    "tailwindcss": "^3.4.0",
    "date-fns": "^3.6.0",
    "papaparse": "^5.4.1",
    "@react-pdf/renderer": "^3.4.0"
  }
}
```

---

### Komponen 5: iOS App 🍎

React Native codebase Phase 1 adalah JavaScript universal — tidak perlu rewrite untuk iOS.

---

#### Yang Perlu Ditambahkan

1. **`apps/mobile/ios/`** — generated via `npx react-native init`
2. **APNs Certificate** — Apple Push Notifications + Firebase iOS config (`GoogleService-Info.plist`)
3. **Deep Linking** — `applinks:app.bukupay.id` untuk invite karyawan
4. **App Store assets** — screenshots, icon 1024px, privacy policy URL

#### [MODIFY] `apps/mobile/src/` — Platform-specific fixes

```jsx
// Cek semua Platform.OS usage, tambahkan iOS handling:
import { Platform, SafeAreaView } from 'react-native';

const statusBarHeight = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight;
```

#### [NEW] `.github/workflows/deploy-ios.yml`

```yaml
name: Deploy iOS — TestFlight
on:
  workflow_dispatch:
jobs:
  build-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: cd apps/mobile/ios && pod install
      - name: Build & Sign IPA
        uses: yukiarrr/ios-build-action@v1.5.0
        with:
          project-path: apps/mobile/ios/BukuPay.xcodeproj
          export-method: app-store
          ...
      - name: Upload to TestFlight
        uses: apple-actions/upload-testflight-build@v1
```

---

### Komponen 6: Backend Extensions

#### [NEW] `apps/backend/src/modules/report/`

```
report/
├── report.service.js    ← daily, weekly, monthly, export CSV
├── report.controller.js
└── report.routes.js
```

**`report.service.js` — core logic:**
```javascript
async function getDailyReport(userId, storeId, date) {
  const start = startOfDay(parseISO(date));
  const end = endOfDay(parseISO(date));

  const [txData, settlementData] = await Promise.all([
    prisma.transaction.aggregate({
      where: { storeId, status: 'PAID', paidAt: { gte: start, lte: end } },
      _sum: { amount: true, fee: true, netAmount: true },
      _count: { id: true },
    }),
    prisma.settlement.aggregate({
      where: { storeId, status: 'COMPLETED', processedAt: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
  ]);

  // Hourly breakdown
  const hourly = await prisma.$queryRaw`
    SELECT date_trunc('hour', "paidAt") as hour,
           SUM(amount) as revenue,
           COUNT(*) as count
    FROM "Transaction"
    WHERE "storeId" = ${storeId}
      AND status = 'PAID'
      AND "paidAt" BETWEEN ${start} AND ${end}
    GROUP BY 1 ORDER BY 1
  `;

  return { date, ...txData, hourly, settlementData };
}

async function exportCsv(userId, storeId, startDate, endDate, res) {
  // Stream langsung ke response — tidak load semua ke memory
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename=transaksi-${startDate}.csv`);

  const stringify = require('csv-stringify');
  const stream = stringify({ header: true, columns: [...] });
  stream.pipe(res);

  const cursor = prisma.transaction.findMany({
    where: { storeId, paidAt: { gte: new Date(startDate), lte: new Date(endDate) } },
    orderBy: { paidAt: 'desc' },
  });

  for await (const tx of cursor) {
    stream.write(tx);
  }
  stream.end();
}
```

#### [MODIFY] `apps/backend/src/app.js`

Register routes baru:
```javascript
const soundboxRoutes    = require('./modules/soundbox/soundbox.routes');
const employeeRoutes    = require('./modules/employee/employee.routes');
const reportRoutes      = require('./modules/report/report.routes');

app.use('/api/soundbox',   authenticate, soundboxRoutes);
app.use('/api/employee',   authenticate, employeeRoutes);
app.use('/api/reports',    authenticate, reportRoutes);
```

---

## Urutan Pengerjaan

```
Minggu 13–14: MQTT Foundation
  ├── Setup Mosquitto broker + TLS production (AWS IoT Core)
  ├── Backend: mqtt.js config + soundbox module
  ├── Integrasi: webhook Xendit → MQTT publish
  ├── ESP32 firmware: WiFi + MQTT subscribe + DFPlayer audio
  └── Hardware prototype (order komponen dari Tokopedia)

Minggu 15–16: Soundbox Polish + Multi-kasir
  ├── BLE provisioning firmware (WiFi config via Bluetooth)
  ├── Mobile: SoundboxPairScreen + SoundboxListScreen
  ├── Backend: Employee invite system (WhatsApp link + join flow)
  ├── Backend: PIN login untuk kasir
  └── Mobile: InviteEmployeeScreen + KasirModeScreen

Minggu 17–18: Pencairan Instan + Report Module
  ├── Instant disbursement service + BullMQ priority queue
  ├── Mobile: SettlementScreen update + modal konfirmasi
  ├── Backend: report module (daily/weekly/monthly)
  ├── Backend: CSV export streaming
  └── Unit tests semua module baru

Minggu 19–20: Web Dashboard Foundation
  ├── Init Next.js 14 + Tailwind + shadcn/ui
  ├── Auth flow (OTP → JWT → NextAuth session)
  ├── Layout + sidebar + mobile responsive
  ├── Overview page: KPI cards + Recharts
  └── Transactions page: tabel sortable + filter

Minggu 21–22: Web Dashboard Lanjut + iOS
  ├── Web: Settlements + Reports + export CSV/PDF
  ├── Web: Soundbox management page
  ├── Web: Employee management page
  ├── iOS: ios/ folder + CocoaPods
  └── iOS: APNs + Firebase iOS config

Minggu 23–24: Testing, Polish & Launch
  ├── E2E test: payment → MQTT → audio (hardware loop test)
  ├── iOS TestFlight internal testing
  ├── Load test web dashboard (Playwright + k6)
  ├── Security audit Phase 2 (OWASP)
  ├── Zero-downtime deploy dengan blue-green
  └── Monitoring: Grafana dashboard untuk MQTT metrics
```

---

## Verification Plan

### Automated Tests

```bash
# Backend — new modules
cd apps/backend
npm test -- --testPathPattern=soundbox
npm test -- --testPathPattern=employee
npm test -- --testPathPattern=report

# Web Dashboard
cd apps/web
npm run test        # Jest + React Testing Library
npm run e2e         # Playwright E2E

# Load test MQTT (100 perangkat simultan)
node tests/load/mqtt-devices.js --devices 100

# k6 — Instant Settlement
k6 run tests/load/instant-settlement.js --vus 50 --duration 60s

# k6 — Report export
k6 run tests/load/report-export.js --vus 20 --duration 30s
```

### Manual Verification

| Skenario | Expected Result |
|---|---|
| Pembayaran masuk → Soundbox berbunyi | Audio keluar < 2 detik setelah webhook diterima |
| Soundbox offline → tetap bayar | FCM tetap terkirim, suara skip gracefully |
| Pairing device baru via QR | Device terdaftar & online dalam 30 detik |
| Undang karyawan via WhatsApp | Link masuk < 10 detik, join flow berhasil |
| Kasir login PIN + coba buka laporan | PIN login berhasil, laporan tidak bisa diakses |
| Request pencairan instan | Dana masuk < 10 menit (jam kerja bank) |
| Export CSV 1000 transaksi | File terdownload < 5 detik (streaming) |
| Web Dashboard load | First Contentful Paint < 2 detik |
| iOS FCM notification | Notifikasi muncul di iPhone saat payment masuk |
| iOS full flow | Login → KYC → QRIS → Transaksi: identik dengan Android |

### Kriteria Launch Phase 2

- [ ] ✅ Soundbox latency < 2 detik (MQTT end-to-end)
- [ ] ✅ BLE provisioning tanpa akses router
- [ ] ✅ Kasir PIN login, tidak bisa akses data sensitif
- [ ] ✅ Pencairan instan masuk ke rekening < 10 menit
- [ ] ✅ Web Dashboard: CSV export berjalan
- [ ] ✅ Web Dashboard: Lighthouse Performance score > 85
- [ ] ✅ iOS app berjalan di iOS 15+ (iPhone XS ke atas)
- [ ] ✅ Zero-downtime deploy (blue-green)
- [ ] ✅ MQTT broker uptime > 99.5% selama 1 minggu staging

---

## Dependensi Eksternal Tambahan

| Service | Keperluan | Status |
|---|---|---|
| **AWS IoT Core** | MQTT broker managed production | ⏳ Perlu setup |
| **Apple Developer Account** | iOS distribution + APNs | ⏳ Perlu setup |
| **App Store Connect** | TestFlight + submission | ⏳ Perlu setup |
| **Xendit Instant Disbursement** | Aktifkan fitur pencairan instan | ⏳ Konfirmasi |
| **Vercel** | Hosting Web Dashboard (Next.js) | ⏳ Perlu setup |
| **ESP32 + DFPlayer Mini** | Prototype hardware soundbox (min 5 unit) | ⏳ Perlu order |

> [!WARNING]
> Hardware ESP32 perlu dipesan **sebelum Minggu 13** dimulai (lead time 3–7 hari dari Tokopedia).

> [!TIP]
> AWS IoT Core lebih disarankan daripada self-hosted Mosquitto untuk production: managed TLS, device registry, auto-scaling, dan pricing ~$0.08/juta messages — sangat terjangkau untuk skala awal.

---

## Estimasi Waktu & Tim

| Role | Tanggung Jawab | Estimasi |
|---|---|---|
| Backend Developer | Soundbox, employee, report, instant settlement modules | 3 bulan |
| Mobile Developer (RN) | iOS setup, screens soundbox/employee, KasirMode | 3 bulan |
| Frontend Developer (Web) | Next.js dashboard, Recharts, export | 3 bulan |
| Firmware/IoT Developer | ESP32 firmware, BLE provisioning, audio | 2 bulan |
| DevOps | AWS IoT Core, Vercel, blue-green deploy, monitoring | 3 minggu |
| QA | Hardware integration test, E2E web, iOS regression | 3 minggu |

---

## Perbandingan Phase 1 vs Phase 2

| Fitur | Phase 1 ✅ | Phase 2 🎯 |
|---|---|---|
| Platform | Android only | Android + **iOS** + **Web Dashboard** |
| Notifikasi | FCM push | FCM + **MQTT Soundbox audio** |
| Settlement | 3x/hari otomatis | 3x/hari + **Instan H+0** |
| User role | Owner only | Owner + **Multi-kasir (PIN login)** |
| Laporan | In-app ringkasan | In-app + **Web + Export CSV/PDF** |
| Hardware | — | **ESP32 Soundbox** |
| Multi-toko | CRUD toko ada | + **Employee per toko + permissions** |

---

*Phase 3 (API Marketplace, Advanced Analytics, Batch Import, White-label) akan direncanakan setelah Phase 2 selesai.*
