# Walkthrough Phase 2 — BukuPay Clone

## ✅ Semua Fitur Phase 2 Telah Diimplementasikan

---

## 1. 🔊 MQTT Soundbox Infrastructure

### Backend
- **`src/config/mqtt.js`** — MQTT client dengan auto-reconnect, TLS support, QoS 1 publish
- **`src/modules/soundbox/`** — soundbox.service + controller + routes
  - `POST /api/soundbox/register` — daftarkan device + generate MQTT credentials
  - `GET /api/soundbox/devices` — list devices per toko dengan status online/offline
  - `POST /api/soundbox/test/:id` — kirim test sound ke device
  - Heartbeat listener: `bukupay/device/+/status` → update `isOnline` real-time
- **`src/webhooks/xendit.controller.js`** — setelah `recordPayment()`, publish ke semua soundbox online via `publishToSoundbox()` (fire & forget, tidak block response)

### Infrastructure
- **`docker-compose.yml`** — Mosquitto broker aktif (port 1883 + 9001 WebSocket)
- **`docker/mosquitto/mosquitto.conf`** — auth required, persistence, log

### Mobile
- **`SoundboxListScreen`** — daftar device, online/offline badge, test suara button
- **`SoundboxPairScreen`** — input MAC Address dari sticker perangkat white-label, success screen menampilkan MQTT credentials sekali (save reminder)

---

## 2. 👥 Multi-Kasir (KasirMode)

### Backend
- **`src/modules/employee/`** — employee.service + controller + routes
  - Invite via WhatsApp: `POST /api/employee/invite` → generate token Redis 24 jam
  - Join via link: `POST /api/employee/join` → validasi token + buat StoreEmployee record
  - PIN login: `POST /api/employee/pin-login` → bcrypt verify + JWT kasir (8 jam)
  - Permission management: canRefund, canViewReport, canManageEmployees

### Mobile
- **`InviteEmployeeScreen`** — input nomor HP + permission checkboxes → kirim WhatsApp
- **`EmployeeListScreen`** — daftar karyawan + permission toggle per kasir
- **`KasirModeScreen`** — 2 phase: PIN login (dot visualizer) → QR Display fullscreen dengan clock, restricted notice, session 8 jam

### Web Dashboard
- **`/dashboard/employees`** — permission toggle buttons, invite modal + WhatsApp, set PIN modal, hapus karyawan

---

## 3. ⚡ Pencairan Instan (Xendit Disbursement)

### Backend
- Settlement service diperluas dengan endpoint `POST /api/settlements/instant`
- Xendit Disbursement API (Rp 2.500 biaya, minimal Rp 50.000)
- Prisma schema: `SettleType` enum (`INSTANT` | `SCHEDULED`), field `fee` di Settlement

### Mobile
- **`SettlementScreen`** (updated) — tombol "⚡ Cairkan Sekarang" muncul jika saldo ≥ Rp 50.000
- Modal konfirmasi: breakdown (saldo - fee = yang diterima), loading state
- Riwayat: badge `⚡ Instan` di item settlement, tampilkan fee admin

### Web Dashboard
- **`/dashboard/settlements`** — balance hero card dengan gradient, instant button, modal konfirmasi, riwayat dengan badge instan

---

## 4. 📊 Report Module

### Backend (`src/modules/report/`)
- **Daily** — aggregate + hourly breakdown via raw SQL `date_trunc('hour', ...)`
- **Weekly** — 7 hari breakdown dengan nama hari Indonesia (date-fns locale)
- **Monthly** — weekly breakdown + top 5 hari terbaik
- **Top Hours** — 7 hari terakhir, sorted by txCount
- **CSV Export** — streaming response dengan BOM `\uFEFF` untuk Excel compatibility, batch 100 rows

### Web Dashboard
- **`/dashboard/reports`** — period toggle (harian/mingguan/bulanan), Recharts LineChart + BarChart, top 5 hari ranking, date range picker untuk export

---

## 5. 🌐 Web Dashboard (Next.js 14)

### Merchant Portal
| Halaman | Path | Fitur Utama |
|---|---|---|
| Overview | `/dashboard` | 4 KPI cards, line chart mingguan, bar chart per jam, soundbox status |
| Transaksi | `/dashboard/transactions` | Tabel + filter status + export CSV + pagination |
| Pencairan | `/dashboard/settlements` | Balance hero, instant button, riwayat |
| Laporan | `/dashboard/reports` | Period toggle + Recharts + top days + export |
| Karyawan | `/dashboard/employees` | List + permissions + invite + set PIN |
| Soundbox | `/dashboard/soundbox` | Status cards + edit + test sound |
| Pengaturan | `/dashboard/settings` | Profil + KYC status + rekening bank |

### Admin Panel
| Halaman | Path | Fitur Utama |
|---|---|---|
| Dashboard | `/admin` | 6 KPI global + total revenue platform |
| Merchant | `/admin/merchants` | Search + filter KYC + review modal + suspend |
| Activity Log | `/admin/logs` | Color-coded log (merah=suspend, hijau=approve) |

---

## 6. 🍎 iOS Support

### Mobile App
- **`AppNavigator.jsx`** — `useSafeAreaInsets()` untuk tab bar height dinamis di iPhone notch
- Semua screen Phase 2 menggunakan `Platform.OS === 'ios'` conditional padding
- `paddingTop: Platform.OS === 'ios' ? 56 : 40` di semua screen header

### CI/CD
- **`.github/workflows/deploy-ios.yml`** — macOS 14 Apple Silicon runner
  - Code signing via GitHub Secrets (certificate + provisioning profile)
  - Cocoapods cache untuk build lebih cepat
  - `xcodebuild archive` + `exportArchive` + upload ke TestFlight via `xcrun altool`
  - Slack notification success/failure

---

## Required GitHub Secrets untuk iOS Deploy

```
APPLE_CERTIFICATE_BASE64       # .p12 export dari Keychain, base64 encoded
APPLE_CERTIFICATE_PASSWORD     # Password .p12
KEYCHAIN_PASSWORD              # Password temporary keychain
APPLE_PROVISIONING_PROFILE_BASE64  # .mobileprovision, base64 encoded
APPLE_TEAM_ID                  # 10-char Team ID dari Apple Developer
ASC_API_KEY_ID                 # App Store Connect API Key ID
ASC_API_ISSUER_ID              # Issuer ID dari App Store Connect
ASC_API_KEY_BASE64             # AuthKey_*.p8, base64 encoded
SLACK_WEBHOOK_URL              # (opsional) notifikasi build
```

---

## Environment Variables Phase 2

```env
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=backend
MQTT_PASSWORD=bukupay_mqtt_change_this
INSTANT_SETTLEMENT_FEE=2500
INSTANT_SETTLEMENT_MIN=50000
APP_DEEP_LINK=https://app.bukupay.id
NEXT_PUBLIC_API_URL=https://api.bukupay.id
```

---

## File Summary — Phase 2 (31 file baru)

| Area | Files |
|---|---|
| Backend | 9 files (soundbox/employee/report/admin modules + mqtt config) |
| Infrastructure | 3 files (docker-compose update, mosquitto.conf, passwd) |
| Mobile | 5 files (KasirMode, SoundboxPair, EmployeeList, InviteEmployee, SoundboxList) |
| Mobile Updates | 2 files (SettlementScreen instant, AppNavigator Phase 2) |
| Web Dashboard | 9 files (layout, 7 halaman merchant, 3 admin pages) |
| Web Support | 4 files (package.json, next.config, lib/api, lib/store) |
| CI/CD | 1 file (deploy-ios.yml) |
| Config | 3 files (.env.example, backend package.json, api/services.js) |
