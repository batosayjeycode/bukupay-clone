# Task Tracker — Phase 2 BukuPay Clone

## Keputusan Dikonfirmasi
- Pencairan Instan: Xendit Instant Disbursement (Rp 2.500/transfer)
- Hardware Soundbox: White-label vendor China
- Web Dashboard: Merchant Portal + Admin Panel

---

## Komponen 6: Backend Extensions
- [x] Extend Prisma schema (SoundboxDevice, SettleType enum, StoreEmployee fields, AdminLog)
- [x] Module: Soundbox (register, CRUD, MQTT credentials)
- [x] Module: Employee (invite, join, PIN login, permissions)
- [x] Module: Report (daily, weekly, monthly, CSV export streaming)
- [x] Module: Admin (merchant list, global stats, KYC review, suspend/activate)
- [x] Config: MQTT publisher (mqtt.js)
- [x] Extend webhook Xendit: MQTT publish setelah FCM
- [x] Register routes baru di app.js
- [x] server.js: initMqtt() di startup

## Komponen 1: MQTT Infrastructure
- [x] Docker-compose: tambah Mosquitto service
- [x] docker/mosquitto/mosquitto.conf
- [x] docker/mosquitto/passwd
- [x] Backend: src/config/mqtt.js

## Komponen 2: Multi-kasir (Mobile)
- [x] Mobile: screens/employee/InviteEmployeeScreen.jsx
- [x] Mobile: screens/employee/EmployeeListScreen.jsx
- [x] Mobile: screens/employee/KasirModeScreen.jsx
- [x] Mobile: screens/soundbox/SoundboxListScreen.jsx
- [x] Mobile: screens/soundbox/SoundboxPairScreen.jsx
- [x] AppNavigator: semua screen Phase 2 terdaftar + iOS SafeAreaInsets fix

## Komponen 3: Pencairan Instan (Mobile)
- [x] Mobile: SettlementScreen — tombol ⚡ Cairkan Sekarang + modal konfirmasi
- [x] Mobile: API services — requestInstant()

## Komponen 4: Web Dashboard
- [x] Init Next.js 14 + Tailwind + package.json + next.config.js
- [x] apps/web/lib/api.js (axios client + semua service methods)
- [x] apps/web/lib/store.js (Zustand auth + dashboard stores)
- [x] Auth: login/page.jsx (OTP 2-step)
- [x] Layout: DashboardLayout + Sidebar (layout.jsx)
- [x] Overview page: KPI cards + Recharts (page.jsx)
- [x] Transactions page: tabel + filter + export CSV
- [x] Reports page: Recharts + period toggle + export
- [x] Soundbox page: status + edit + test
- [x] Settlements page: balance + instant + riwayat
- [x] Employees page: list + permissions toggle + invite + set PIN
- [x] Settings page: profil + KYC status + rekening bank
- [x] Admin layout + Admin dashboard (global stats)
- [x] Admin merchants page (KYC review + suspend)
- [x] Admin: Logs page (activity log dengan color coding)

## Komponen 5: iOS App
- [x] AppNavigator: Phase 2 screens + useSafeAreaInsets untuk iPhone notch
- [x] SettlementScreen: Platform.OS === 'ios' paddingTop fix
- [x] KasirModeScreen: Platform.OS handling
- [x] SoundboxPairScreen: Platform.OS handling + monospace font iOS/Android
- [x] .github/workflows/deploy-ios.yml (TestFlight + App Store Connect API)

## Mobile API Services
- [x] apiService.employee (invite, join, list, updatePermissions, setPin, pinLogin, remove)
- [x] apiService.soundbox (register, getDevices, updateDevice, testSound)
- [x] settlementApi.requestInstant

## .env.example
- [x] Phase 2 variables (MQTT, Instant Settlement, Web, APNs)

## Backend package.json
- [x] mqtt, date-fns, csv-stringify dependencies

---

## Status: ✅ PHASE 2 COMPLETE — Semua item selesai
