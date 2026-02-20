# Scalability Protocol (Critical Hard Rules)

## 0. Introduction
Scalability is not an afterthought; it is the foundation. This protocol defines the **Critical Hard Rules** that ensure the application can grow from an MVP to an Enterprise solution without refactoring the core architecture.

## 1. Codebase Scalability
- **The "3-Use" Rule**: Any logic, utility, or UI pattern used in **3 or more places** MUST be abstracted into a shared resource (`src/lib/` or `src/components/shared/`).
- **Strict Typing**: TypeScript `strict` mode is non-negotiable.
    - **No `any`**: Explicitly define types/interfaces for all Props, State, and API responses.
    - **Shared Interfaces**: Domain entities (e.g., `User`, `Booking`) must be defined in `src/types/` and reused across Models and ViewModels.
- **Barrel Exports**: Use `index.ts` files in folders to expose only the public API of a feature/module. Keep imports clean: `import { Button } from "@/components/ui"` rather than `.../components/ui/button/index`.

## 2. Performance Scalability
- **Server-Side Default**: By default, all pages `app/` are Server Components.
    - **"use client" Strategy**: Push strictly to the "Leaf" nodes (Presentations/Components). Never make a Root Layout generic client-side unless absolutely necessary (e.g., Redux Provider wrapper).
- **Dynamic Imports**: Any heavy UI component (Charts, Maps, Modals) MUST be lazy-loaded using `next/dynamic`.
- **Image Optimization**: MANDATORY use of `next/image` with proper sizing and format (WebP/AVIF).

## 3. Data Scalability (Fullstack)
- **Centralized API Layer**:
    - **Prohibited**: Raw `fetch` or `axios` calls inside `useApi[Feature]`.
    - **Mandatory**: Use a centralized generic HTTP client (`src/lib/api-client.ts`) with Interceptors for Auth, Error Handling, and Logging.
    - `useApi[Feature]` should strictly define *endpoints*, not HTTP logic.
- **Database Indexing**: MongoDB Schemas MUST define indexes for fields used in queries (e.g., `email`, `status`, `createdAt`).
- **Pagination**: NO "Select All". All list endpoints MUST implement cursor-based or offset-based pagination.

## 4. State Management Scalability
- **Redux Usage**:
    - **Global Only**: User Session, Theme, Global Alerts, Shopping Cart.
    - **Forbidden**: Form state (use `react-hook-form`), Local UI toggles (use `useState`).
- **Slice Pattern**: Redux stores must be modular (`slices/userSlice.ts`, `slices/uiSlice.ts`), not one giant file.

## 5. Maintenance Scalability
- **Commenting**: JSDoc is mandatory for complex functions, explaining *WHY*, not just *WHAT*.
- **Error Boundaries**: Wrap major feature areas (Dashboard, Admin) in React Error Boundaries to prevent full app crashes.
