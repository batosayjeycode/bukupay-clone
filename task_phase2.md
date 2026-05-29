# Task Tracker — Phase 2 BukuPay Clone

## Keputusan Dikonfirmasi
- Pencairan Instan: Xendit Instant Disbursement (Rp 2.500/transfer)
- Hardware Soundbox: White-label vendor China
- Web Dashboard: Merchant Portal + Admin Panel

---

## Komponen 6: Backend Extensions
- [/] Extend Prisma schema (SoundboxDevice, SettleType enum, StoreEmployee fields)
- [ ] Module: Soundbox (register, CRUD, MQTT credentials)
- [ ] Module: Employee (invite, join, PIN login, permissions)
- [ ] Module: Report (daily, weekly, monthly, CSV export streaming)
- [ ] Module: Instant Settlement (extend settlement module)
- [ ] Config: MQTT publisher (mqtt.js)
- [ ] Extend webhook Xendit: MQTT publish setelah FCM
- [ ] Register routes baru di app.js
- [ ] Admin API: merchant list, overview stats (untuk Admin Panel)

## Komponen 1: MQTT Infrastructure
- [ ] Docker-compose: tambah Mosquitto service
- [ ] docker/mosquitto/mosquitto.conf
- [ ] Backend: src/config/mqtt.js
- [ ] Unit test: soundbox.service.test.js

## Komponen 2: Multi-kasir (Mobile)
- [ ] Mobile: screens/employee/InviteEmployeeScreen.jsx
- [ ] Mobile: screens/employee/EmployeeListScreen.jsx
- [ ] Mobile: screens/employee/KasirModeScreen.jsx
- [ ] Mobile: screens/soundbox/SoundboxListScreen.jsx
- [ ] Mobile: screens/soundbox/SoundboxPairScreen.jsx

## Komponen 3: Pencairan Instan (Mobile)
- [ ] Mobile: Update SettlementScreen (tombol "Cairkan Sekarang")
- [ ] Mobile: InstantSettlementModal (konfirmasi fee)

## Komponen 4: Web Dashboard
- [ ] Init Next.js 14 + Tailwind + shadcn/ui
- [ ] apps/web/package.json
- [ ] Auth: login/page.jsx (OTP) + verify/page.jsx
- [ ] Layout: DashboardLayout + Sidebar
- [ ] Overview page: KPI cards + RevenueChart
- [ ] Transactions page: tabel + filter + export CSV
- [ ] Settlements page
- [ ] Reports page: Recharts + date range
- [ ] Stores page: manajemen toko
- [ ] Employees page: manajemen karyawan
- [ ] Soundbox page: status perangkat
- [ ] Settings page: profil + bank account
- [ ] Admin Panel: /admin route + merchant list + global stats
- [ ] API lib: axios instance + NextAuth config

## Komponen 5: iOS App
- [ ] Platform-specific fixes (SafeAreaView, StatusBar)
- [ ] deploy-ios.yml workflow

## Komponen Firmware (Dokumentasi)
- [ ] apps/firmware/ README.md + platformio.ini + arsitektur

## CI/CD
- [ ] deploy-ios.yml GitHub Actions
