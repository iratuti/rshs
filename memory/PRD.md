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
- Google OAuth login (NextAuth.js) - primary auth
- Demo login accounts (admin@demo.com, user@demo.com) - for testing
- MongoDB database for data storage
- 13 toggle actions for patient procedures
- 15 checkbox options for keterangan tindakan
- 3 ketergantungan options (ADL Self Care, Partial Care, Total Care)
- Report generator for e-Kinerja and e-Remunerasi formats with dynamic templates
- User subscription management (TRIAL/ACTIVE/EXPIRED)
- Support ticket system with admin management
- Per-user customizable report templates with 18 shortcodes + conditional logic

---

## Architecture

### Tech Stack
- **Frontend**: Next.js 14 App Router (TypeScript)
- **Backend (Preview)**: FastAPI (Python) - routes /api/* via K8s ingress
- **Backend (Production)**: Next.js API Routes - on Vercel
- **Database**: MongoDB (unified `sepulangdinas` DB)
- **Auth**: NextAuth.js with Google OAuth + demo accounts
- **UI**: Shadcn/UI + Tailwind CSS

### Key Architecture Notes
- **DUAL API**: Preview routes `/api/*` to FastAPI; production uses Next.js API routes. Any new endpoint must be in both.
- **Database**: Single `sepulangdinas` DB used by both backends.
- **Tenant Isolation**: All data filtered by user_id from authenticated session.
- **Admin**: Super admin (theomahrizal@gmail.com) hardcoded. VIP lifetime user (iratuti66@gmail.com) hardcoded.

### Project Structure
```
/app
├── backend/              # FastAPI backend
│   ├── server.py         # Main API (decodes NextAuth JWTs)
│   └── tests/            # Pytest tests
├── frontend/             # Next.js 14 App
│   ├── src/
│   │   ├── app/
│   │   │   ├── admin/
│   │   │   │   ├── page.tsx          # Admin dashboard + user subscription override
│   │   │   │   └── tickets/page.tsx  # Ticket management
│   │   │   ├── api/                  # Next.js API routes (for Vercel production)
│   │   │   │   ├── admin/
│   │   │   │   │   ├── users/route.ts
│   │   │   │   │   ├── users/[userId]/route.ts
│   │   │   │   │   ├── tickets/route.ts
│   │   │   │   │   ├── tickets/[ticketId]/status/route.ts
│   │   │   │   │   ├── tickets/[ticketId]/reply/route.ts
│   │   │   │   │   ├── tickets/[ticketId]/close/route.ts
│   │   │   │   │   ├── tickets/[ticketId]/route.ts
│   │   │   │   │   └── recover-data/route.ts
│   │   │   │   ├── auth/[...nextauth]/route.ts
│   │   │   │   └── report-templates/route.ts
│   │   │   ├── dashboard/
│   │   │   │   ├── settings/page.tsx
│   │   │   │   ├── e-kinerja/page.tsx
│   │   │   │   └── e-remunerasi/page.tsx
│   │   ├── components/layout/
│   │   ├── lib/
│   │   │   ├── auth-helpers.ts
│   │   │   ├── report-templates.ts
│   │   │   ├── models.ts
│   │   │   └── mongodb.ts
```

---

## Completed Features

### Security & Auth (Feb-Mar 2026) - DONE
- Strict Tenant Isolation on all API routes
- NextAuth JWT decoding in FastAPI backend
- New user auto-creation on first Google sign-in
- Super Admin & VIP user hardcoded roles
- Sidebar/BottomNav admin menu visibility fix

### Dynamic Report Templates (Mar 2026) - DONE
- Per-user customizable e-Kinerja and e-Remunerasi templates
- 18 shortcodes including conditional logic ([IF_PASIEN_BARU]...[ENDIF])
- Settings page for template CRUD

### Admin Ticket Management Fix (Mar 20, 2026) - DONE
- **Root cause**: Status mismatch between backend ("Open"/"Answered") and frontend ("OPEN"/"RESOLVED")
- **Fix**: Standardized TicketStatus enum to uppercase (OPEN, IN_PROGRESS, RESOLVED, CLOSED)
- Added dedicated `PUT /api/admin/tickets/{id}/status` endpoint for status-only updates
- Frontend normalizes old DB status values on fetch
- Separated reply and status change operations
- **Test**: 24/24 tests passed (iteration_7.json)

### Manual Subscription Override (Mar 20, 2026) - DONE
- Edit button (pencil icon) on each user row in admin dashboard
- Modal with status dropdown (ACTIVE/TRIAL/EXPIRED) and date picker (berlaku_sampai)
- `PUT /api/admin/users/{userId}` endpoint in both FastAPI and Next.js
- **Test**: Verified working in iteration_7.json

### Data Recovery Tool - DONE
- Admin-only button to migrate orphaned data to correct user account

---

## Next Tasks (Priority Order)
1. **P1: Finalize Midtrans Subscription Flow** - Connect billing page to Midtrans API, handle payment popup, update subscription status
2. **P2: Implement Midtrans Webhook Handler** - Secure webhook endpoint for payment notifications
3. **P1: Consolidate FastAPI → Next.js API routes** - Eliminate dual-API architecture
4. **P2: Refactor Mongoose Models to TypeScript**

---

## Test Reports
- `/app/test_reports/iteration_6.json` - Tenant Isolation security tests (27/27 passed)
- `/app/test_reports/iteration_7.json` - Admin Ticket + Subscription Override tests (24/24 passed)
- `/app/backend/tests/test_tenant_isolation.py`
- `/app/backend/tests/test_admin_ticket_user_endpoints.py`
