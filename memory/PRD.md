# SepulangDinas - Product Requirements Document

## Original Problem Statement
Building "SepulangDinas" - a SaaS platform for Indonesian hospital nurses to automate daily administrative performance reports (e-Kinerja and e-Remunerasi). Features include:
- Multi-user SaaS with TRIAL/ACTIVE/EXPIRED subscriptions
- Role-based dashboards (USER vs ADMIN)
- Input Logbook with patient data, 13 toggle switches, checkbox array for keterangan, ketergantungan field
- Generator Laporan pages (e-Kinerja and e-Remunerasi) with historical date selection
- Rekap Logbook with monthly data table
- Billing page with Midtrans integration (mocked)
- Support ticket system
- PWA installable on mobile (pending)

## User Personas
1. **Hospital Nurses (Primary Users)**: Work long shifts, need quick way to record daily patient interactions and generate administrative reports
2. **Admin/Owner**: Manages users, handles support tickets, monitors revenue

## Core Requirements
- Demo login accounts for immediate testing (admin@demo.com, user@demo.com)
- MongoDB database for data storage
- 13 toggle actions for patient procedures
- 15 checkbox options for keterangan tindakan
- 3 ketergantungan options (ADL Self Care, Partial Care, Total Care)
- Report generator for e-Kinerja (with sub-point splitting) and e-Remunerasi formats
- User subscription management (TRIAL/ACTIVE/EXPIRED)
- Support ticket system

## What's Been Implemented (Feb 26, 2024)

### Backend (FastAPI)
- [x] Demo login with CredentialsProvider (user@demo.com, admin@demo.com)
- [x] Session management with httpOnly cookies
- [x] User model with subscription status
- [x] Patient CRUD API
- [x] Logbook CRUD API with tindakan items
- [x] TindakanItem model with jenis_pasien, ketergantungan, and 13 toggle fields
- [x] Ticket support system API
- [x] Admin endpoints (users, tickets, stats)
- [x] Midtrans billing placeholder/mock

### Frontend (React)
- [x] Login page with Demo buttons (user/admin)
- [x] Dashboard layout with sidebar (desktop) and mobile header + bottom nav (mobile)
- [x] Input Logbook page with:
  - Shift info form (tanggal, shift, jam datang/pulang)
  - Add tindakan modal with patient search
  - Status Pasien radio group (Pasien Baru, Lama, Pulang)
  - Ketergantungan radio group (ADL Self Care, Partial Care, Total Care)
  - 15 keterangan checkboxes
  - 13 toggle switches for specific actions
  - Catatan lainnya textarea
- [x] e-Kinerja page with:
  - Date picker for historical data
  - Sub-point splitting (multi-line points split into individual copyable cards)
  - Category badges (PASIEN BARU, PASIEN PULANG, SEMUA PASIEN, ABSENSI)
  - Individual copy buttons per sub-point
  - "Salin Semua" button
- [x] e-Remunerasi page with:
  - Two modes: Per Nilai (by date) and Per Tanggal (by month/point)
  - Point generator with copy functionality
- [x] Rekap Logbook page with:
  - Month/year filter
  - Spreadsheet-style table with all required columns
  - Export CSV and Print buttons (mocked)
- [x] Master Data Pasien page
- [x] Billing page with subscription status (mocked)
- [x] Support page with ticket creation
- [x] Admin Dashboard with user management
- [x] Admin Tickets page
- [x] Admin Revenue page (mock data)
- [x] Mobile Header with hamburger menu (Sheet component)
- [x] Separate Logout button in mobile menu

### Design Implementation
- [x] Teal (#0D9488) + Orange (#F97316) color scheme
- [x] Nunito (headings) + Inter (body) fonts
- [x] Mobile-first responsive design
- [x] Shadcn/UI components
- [x] Toast notifications with sonner
- [x] Full-width layout on desktop

## Test Report Summary (Feb 26, 2024)
- **Success Rate**: 100% (11/11 features passed)
- **Test File**: /app/test_reports/iteration_3.json
- **Key Features Verified**:
  - Demo login redirects working
  - Mobile hamburger menu with separate Logout
  - Modal with Status Pasien, Ketergantungan, and 13 toggles
  - e-Kinerja sub-point splitting (22 sub-points)
  - e-Remunerasi two modes
  - Rekap Logbook spreadsheet view
  - Desktop sidebar and mobile bottom nav

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Demo login accounts
- [x] Input Logbook with all required fields
- [x] e-Kinerja report generator with sub-point splitting
- [x] Mobile-responsive layout with hamburger menu
- [x] Ketergantungan field in modal

### P1 (Important) - To Do
- [ ] PWA manifest and service worker for installability
- [ ] Export PDF/CSV functionality for Rekap Logbook
- [ ] Admin ticket reply and close functionality
- [ ] e-Remunerasi engine refinement (combine checkboxes to comma-separated string)

### P2 (Nice to Have)
- [ ] Real Midtrans payment integration
- [ ] Google OAuth authentication
- [ ] Dashboard analytics charts
- [ ] Bulk patient import
- [ ] Report templates customization
- [ ] Dark mode support

## Mocked Features
- Midtrans payment integration (returns placeholder token)
- Export PDF button (shows toast)
- Export CSV button (shows toast)
- Google Auth (pending credentials)

## Credentials
- **Demo User**: user@demo.com / password (redirects to /dashboard)
- **Demo Admin**: admin@demo.com / password (redirects to /admin)

## Architecture
```
/app
├── backend/
│   ├── server.py        # FastAPI backend with all APIs
│   └── .env             # MongoDB credentials
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── EKinerjaPage.js        # e-Kinerja with sub-point splitting
│       │   ├── ERemunerasiPage.js     # e-Remunerasi with 2 modes
│       │   ├── InputLogbookPage.js    # Modal with 13 toggles
│       │   ├── RekapLogbookPage.js    # Spreadsheet view
│       │   └── ...
│       ├── components/
│       │   ├── layout/
│       │   │   ├── DashboardLayout.js
│       │   │   ├── Sidebar.js
│       │   │   ├── MobileHeader.js    # Hamburger menu
│       │   │   └── BottomNav.js
│       │   └── ui/                    # Shadcn components
│       └── contexts/
│           └── AuthContext.js
└── memory/
    └── PRD.md
```

## Next Tasks
1. Implement PWA manifest.json and service worker
2. Implement Export PDF/CSV functionality
3. Complete admin ticket management (reply/close)
4. Refine e-Remunerasi logic per original requirement
