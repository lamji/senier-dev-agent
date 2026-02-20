# QA Handbook: Admin Booking Management E2E

This document outlines the automated test cases for the **Admin** flow. These tests use **Jest** (API-level) and **simulate the login process** to obtain a valid admin JWT, because all admin endpoints require authentication (per `senior-dev-rules.md` Section 3).

## Tooling
- **Framework**: Jest + ts-jest
- **Run Command**: `npm run test:e2e`
- **Test File**: `tests/e2e/admin-flow.test.ts`
- **Prerequisite**: Dev server running (`npm run dev`) on `http://localhost:3000`

## Auth Simulation
- **Endpoint**: `POST /api/auth/callback/credentials`
- **Credentials**: `admin` / `admin123` (MVP hardcoded in `[...nextauth]/route.ts`)
- **Login Flow**:
  1. Fetch CSRF token from `GET /api/auth/csrf`
  2. Submit credentials to `POST /api/auth/callback/credentials` with the CSRF token
  3. Capture the `set-cookie` response headers
  4. Pass the session cookies in all subsequent admin API calls

---

## Test Cases

### TC-A01: Admin Login Simulation
- **Objective**: Verify the test harness can log in and get a session cookie.
- **Expected**: Valid `next-auth.session-token` cookie returned.

### TC-A02: GET /api/bookings (Admin List)
- **Objective**: Fetch all bookings with pagination. Requires admin session.
- **Expected**: 200 + `{ bookings: [...], pagination: { page, limit, total, totalPages } }`

### TC-A03: GET /api/bookings?status=pending (Filtered)
- **Objective**: List only pending bookings.
- **Expected**: 200 + all returned bookings have `status: "pending"`.

### TC-A04: PATCH /api/bookings/[id] — Approve
- **Objective**: Approve a pending booking. Requires admin session.
- **Expected**: 200 + `{ booking: { status: "approved" } }` + email triggered.

### TC-A05: PATCH /api/bookings/[id] — Cancel
- **Objective**: Cancel the same booking. Requires admin session.
- **Expected**: 200 + `{ booking: { status: "canceled" } }` + email triggered.

### TC-A06: PATCH /api/bookings/[id] — Unauthorized (No Token)
- **Objective**: Attempt to PATCH without auth.
- **Expected**: 401 Unauthorized redirect (HTML, not JSON, due to NextAuth middleware).

### TC-A07: GET /api/bookings — Unauthorized (No Token)
- **Objective**: Attempt to GET bookings without auth.
- **Expected**: 401 (redirect).

### TC-A08: Admin Logout Simulation
- **Objective**: Verify the session is terminated after logout.
- **Expected**: Subsequent requests with the same cookie are rejected.

---

## Related Documents
- **User E2E Handbook**: `.agent/qa/qa-hand-book-test-case.md`
- **Knowledge Base**: `.agent/qa/e2e-knowledge-base.md`
- **Senior Dev Rules**: `.agent/workflows/senior-dev-rules.md`
