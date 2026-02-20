# QA Handbook: User Booking Flow E2E

This document outlines the automated test cases for the "User Booking" flow. These tests use **Jest** (API-level) to validate the full booking lifecycle without the overhead of a browser.

## Tooling
- **Framework**: Jest + ts-jest
- **Run Command**: `npm run test:e2e`
- **Test File**: `tests/e2e/booking-flow.test.ts`
- **Prerequisite**: Dev server running (`npm run dev`) on `http://localhost:3000`

## Test Email
`test-case@yopmail.com`

---

## Test Cases

### TC-001: GET /api/bookings/dates
- **Objective**: Confirm the public dates endpoint returns a JSON array of booked dates.
- **Expected**: 200 + `{ bookedDates: [...] }`

### TC-002: GET /api/bookings/availability
- **Objective**: Confirm the availability check returns a boolean for a future date.
- **Expected**: 200 + `{ available: true/false }`

### TC-003: POST /api/bookings (Happy Path)
- **Objective**: Submit a valid booking as `test-case@yopmail.com`.
- **Expected**: 201 + `{ booking: { _id, status: "pending" } }` or 409 if date already taken.

### TC-004: POST /api/bookings (Validation)
- **Objective**: Submit with missing fields and confirm validation fires.
- **Expected**: 400 + `{ error: "Validation failed" }`

### TC-005: GET /api/bookings/find?email=
- **Objective**: Find the booking just created by email.
- **Expected**: 200 + booking object with correct name and email.

### TC-006: GET /api/bookings/find?id=invalid
- **Objective**: Confirm invalid Mongo IDs are caught.
- **Expected**: 400 + error message.

### TC-007: GET /api/bookings/find (No Params)
- **Objective**: Confirm missing params return a helpful error.
- **Expected**: 400 + `"Must provide either email or booking ID."`

### TC-008: GET /api/cron/reminders
- **Objective**: Confirm the cron job endpoint runs without errors.
- **Expected**: 200 + `{ message: "..." }`

---

## `data-test-id` Convention
All interactive UI elements **MUST** have a `data-test-id` attribute following the naming convention:

`[section]-[type]-[action]`

| Element | data-test-id |
|---|---|
| Hero Date Picker | `hero-btn-pick-date` |
| Hero Time Select | `hero-select-time` |
| Hero Check Availability | `hero-btn-check-availability` |
| Hero Book Now | `hero-btn-book-now` |
| Header Find Booking | `header-btn-find-booking` |
| Booking Event Type Select | `select-event-type` |
| Booking Date Picker | `btn-pick-date` |
| Booking Time Select | `select-time` |
| Booking Client Name | `input-client-name` |
| Booking Client Email | `input-client-email` |
| Booking Client Phone | `input-client-phone` |
| Booking Notes | `input-notes` |
| Booking Submit | `btn-submit-booking` |
| Modal Search Input | `modal-input-search` |
| Modal Search Button | `modal-btn-search` |
