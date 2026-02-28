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

---

## 🚀 CRITICAL ARCHITECTURE MIGRATION COMPLETED (Feb 28, 2026)

### Migration from Create React App + Express to Next.js 14 App Router

**STATUS: ✅ COMPLETED & VERIFIED**

The entire application has been successfully migrated from a separated MERN-like stack (Create React App frontend + FastAPI backend) to a **unified full-stack Next.js 14 application** with App Router.

### What Changed:
1. **Frontend**: Migrated from Create React App (`/app/frontend_cra_backup`) to Next.js 14 (`/app/frontend`)
2. **Routing**: Replaced `react-router-dom` with Next.js App Router (file-based routing)
3. **API**: Created Next.js API Route Handlers alongside existing FastAPI backend
4. **Components**: All `.jsx` components converted to `.tsx` with proper TypeScript types
5. **UI Components**: Fixed all shadcn/ui components with proper TypeScript generics

### New Project Structure:
```
/app/frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # Login page
│   │   ├── layout.tsx          # Root layout with AuthProvider
│   │   ├── globals.css         # Global styles
│   │   ├── admin/              # Admin routes
│   │   │   ├── page.tsx        # Admin Dashboard
│   │   │   ├── tickets/page.tsx
│   │   │   └── revenue/page.tsx
│   │   ├── dashboard/          # User routes
│   │   │   ├── page.tsx        # Input Logbook
│   │   │   ├── e-kinerja/page.tsx
│   │   │   ├── e-remunerasi/page.tsx
│   │   │   ├── rekap/page.tsx
│   │   │   ├── pasien/page.tsx
│   │   │   ├── billing/page.tsx
│   │   │   ├── support/page.tsx
│   │   │   └── profile/page.tsx
│   │   └── api/                # Next.js API Routes
│   │       ├── auth/demo-login/route.ts
│   │       ├── logbooks/route.ts
│   │       ├── patients/route.ts
│   │       ├── users/route.ts
│   │       └── tickets/route.ts
│   ├── components/
│   │   ├── layout/             # Sidebar, MobileHeader, BottomNav
│   │   └── ui/                 # shadcn/ui components (all typed)
│   ├── contexts/
│   │   └── AuthContext.tsx     # Client-side auth with localStorage
│   └── lib/
│       ├── mongodb.ts          # MongoDB connection utility
│       ├── models.ts           # Mongoose models
│       └── utils.ts            # Utility functions
├── package.json                # Next.js 16.1.6, React 19
└── next.config.ts
```

### Technologies Used:
- **Framework**: Next.js 16.1.6 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: MongoDB with Mongoose
- **Auth**: Client-side demo auth with localStorage
- **Icons**: Lucide React

---

## 🛠 CRITICAL REGRESSION FIX COMPLETED (Feb 28, 2026)

### Issues Fixed:
1. **✅ Transparent Dropdown Fix** - Added `bg-white` and proper z-index to SelectContent component so dropdowns are readable
2. **✅ "Tambah Pasien" Button Restored** - Added "Tambah pasien baru" link next to Patient Selection dropdown in the modal
3. **✅ All Stubbed Pages Restored** - Full 1:1 conversion from CRA to Next.js App Router:
   - `/dashboard/rekap` - Rekap Logbook with month selector, Export CSV, Print buttons, and full table view
   - `/dashboard/pasien` - Master Data Pasien with CRUD, search, Import/Export CSV, Print PDF
   - `/dashboard/billing` - Billing/Langganan with subscription status, pricing, and payment button
   - `/dashboard/support` - Tiket Support with create ticket modal and ticket list
   - `/dashboard/profile` - User profile with editable name/ruangan, avatar, and quick links

---

## What's Been Implemented (Feb 28, 2026)

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

### Frontend (React) - MAJOR UPDATE
- [x] Login page with Demo buttons (user/admin)
- [x] Dashboard layout with sidebar (desktop) and mobile header + bottom nav (mobile)
- [x] **Modal Scrollable Fix** - Modal now has `max-h-[85vh] overflow-y-auto` for proper scrolling
- [x] **Input Logbook page - COMPLETE REWRITE**:
  - **DATE-DRIVEN FLOW**: Date picker in header controls which logbook is displayed
  - **CONDITIONAL RENDERING**: If no shift data, shows warning "Silakan rekam data shift..." and hides patient list
  - **DUPLICATE PREVENTION**: Cannot add same patient twice for same date
  - **CRUD Actions**: View (Eye), Edit (Pencil), Delete (Trash) buttons on each patient
  - **Edit Modal**: Pre-fills ALL fields (patient, status, ketergantungan, checkboxes, toggles)
  - **View Modal**: Read-only view of patient details
  - Shift info form (tanggal, shift, jam datang/pulang)
  - Add tindakan modal with patient search
  - Status Pasien radio group (Pasien Baru, Lama, Pulang)
  - Ketergantungan radio group (ADL Self Care, Partial Care, Total Care)
  - 15 keterangan checkboxes
  - 13 toggle switches for specific actions (NOW VISIBLE via scrolling)
  - Catatan lainnya textarea
- [x] **e-Kinerja page - MAJOR UPDATE**:
  - **DUAL VIEW MODE**: Tabs for "Tampilan Per Nilai" and "Tampilan Per Tanggal"
  - **NEW Points 6, 7, 8 added** (SEMUA PASIEN category):
    - Point 6: 5 sub-lines (pengkajian, perencanaan, intervensi, implementasi, evaluasi)
    - Point 7: 1 sub-line (visit)
    - Point 8: 7 sub-lines (EMR documentation)
  - Sub-point splitting (multi-line points split into individual copyable cards)
  - Category badges (PASIEN BARU, PASIEN PULANG, SEMUA PASIEN, ABSENSI)
  - Individual copy buttons per sub-point (38 total buttons)
  - "Salin Semua" button
  - Per Tanggal mode: Monthly table by selected point
- [x] **e-Remunerasi page - LOGIC OVERHAULED** with:
  - Two modes: Per Nilai (by date) and Per Tanggal (by month/point)
  - Exact 5-point format as per Indonesian hospital standard:
    - Point 1: Asesmen Keperawatan
    - Point 2: Fungsi Advokasi dan Kolaborasi DPJP
    - Point 3: Dokumentasi Asuhan Rekam Medik
    - Point 4: Tindakan Keperawatan (grouped by 13 specific actions)
    - Point 5: Monitoring EWS
  - Point 4 dynamically groups patients by specific actions performed
- [x] **Rekap Logbook page - FIXED**:
  - **KETERGANTUNGAN column now shows ADL values** (Self Care, Partial Care, Total Care)
  - Previously showed BARU/LAMA/PULANG (incorrect)
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

## Test Report Summary (Feb 26, 2024 - Iteration 4)
- **Success Rate**: 100% (All features passed)
- **Test File**: /app/test_reports/iteration_4.json
- **Key Features Verified**:
  - Input Logbook date-driven flow working
  - No-shift warning shown, patient list hidden when no shift
  - View/Edit/Delete buttons functional
  - Edit modal pre-fills all data correctly
  - Rekap Logbook KETERGANTUNGAN shows ADL values (Partial Care, etc.)
  - e-Kinerja dual view mode working
  - Points 6, 7, 8 generating correct sub-lines
  - 38 individual copy buttons for sub-points

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
