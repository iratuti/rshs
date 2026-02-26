# SepulangDinas - Product Requirements Document

## Original Problem Statement
Building "SepulangDinas" - a SaaS platform for Indonesian hospital nurses to automate daily administrative performance reports (e-Kinerja and e-Remunerasi). Features include:
- Multi-user SaaS with TRIAL/ACTIVE/EXPIRED subscriptions
- Role-based dashboards (USER vs ADMIN)
- Input Logbook with patient data, 15 toggle switches, checkbox array for keterangan
- Generator Laporan page with tabs for e-Remunerasi and e-Kinerja report generation
- Rekap Logbook with monthly data table
- Billing page with Midtrans integration
- Support ticket system
- PWA installable on mobile

## User Personas
1. **Hospital Nurses (Primary Users)**: Work long shifts, need quick way to record daily patient interactions and generate administrative reports
2. **Admin/Owner**: Manages users, handles support tickets, monitors revenue

## Core Requirements (Static)
- Emergent Google OAuth for authentication
- MongoDB database for data storage
- 15 toggle actions for patient procedures
- 16 checkbox options for keterangan tindakan
- Report generator for e-Kinerja and e-Remunerasi formats
- User subscription management (TRIAL/ACTIVE/EXPIRED)
- Support ticket system

## What's Been Implemented (Feb 26, 2024)

### Backend (FastAPI)
- [x] User authentication with Emergent Google OAuth
- [x] Session management with httpOnly cookies
- [x] User model with subscription status
- [x] Patient CRUD API
- [x] Logbook CRUD API with tindakan items
- [x] Ticket support system API
- [x] Admin endpoints (users, tickets, stats)
- [x] Midtrans billing placeholder/mock

### Frontend (React)
- [x] Login page with Google OAuth button
- [x] Dashboard layout with sidebar (desktop) and bottom nav (mobile)
- [x] Input Logbook page with:
  - Shift info form (tanggal, shift, jam datang/pulang)
  - Add tindakan modal with patient search
  - 16 keterangan checkboxes
  - 15 toggle switches for specific actions
  - Catatan lainnya textarea
- [x] Generator Laporan page with:
  - Today's data summary
  - Generate e-Remunerasi button
  - Generate e-Kinerja button
  - Tabbed interface for results
  - Copy to clipboard functionality
- [x] Rekap Logbook page with:
  - Month/year filter
  - Data table with expandable rows
  - Export buttons (placeholder)
  - Monthly summary stats
- [x] Billing page with subscription status
- [x] Support page with ticket creation
- [x] Profile page
- [x] Admin Dashboard with user management
- [x] Admin Tickets page
- [x] Admin Revenue page (mock data)

### Design Implementation
- [x] Teal (#0D9488) + Orange (#F97316) color scheme
- [x] Nunito (headings) + Inter (body) fonts
- [x] Mobile-first responsive design
- [x] Shadcn/UI components
- [x] Toast notifications with sonner

## Prioritized Backlog

### P0 (Critical) - DONE
- [x] Authentication flow
- [x] Basic CRUD operations
- [x] Report generation logic

### P1 (Important) - To Do
- [ ] Real Midtrans payment integration
- [ ] PWA manifest and service worker
- [ ] Export PDF/CSV functionality
- [ ] Email notifications

### P2 (Nice to Have)
- [ ] Dashboard analytics charts
- [ ] Bulk patient import
- [ ] Report templates customization
- [ ] Dark mode support

## Next Tasks
1. Integrate real Midtrans payment when API keys available
2. Add PWA manifest.json and service worker for installability
3. Implement PDF/CSV export functionality
4. Add more comprehensive admin analytics
