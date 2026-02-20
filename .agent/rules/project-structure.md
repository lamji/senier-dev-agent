# Project Structure: Next.js + Shadcn MVVM

This document defines the mandatory directory structure and architectural boundaries for the project.

## 1. Directory Tree
```text
src/
├── app/                      # NEXT.js App Router (Routing Layer ONLY)
│   ├── login/                # Route folder
│   │   └── page.tsx          # FORBIDDEN: Direct UI. Must ONLY import from presentations.
│   ├── layout.tsx            # Global layout configurations
│   └── page.tsx              # Root route. Must ONLY import from presentations.
│
├── components/               # Global/Reusable UI Components
│   ├── [ComponentName]/      # e.g., CustomButton/
│   │   ├── index.tsx         # Main component
│   │   ├── sub-components/   # Internal fragmented parts (if needed)
│   │   └── sub-helpers/      # Internal logic helpers (if needed)
│   ├── Layout/               # Shell components
│   │   ├── index.tsx         # Client-side providers mounting
│   │   └── useLayout.ts      # Logic strictly related to the layout state
│   └── Providers/            # Global Contexts/State Providers
│       └── AlertProvider/
│           ├── index.tsx     # UI element of the provider
│           └── useAlertProvider.ts # Logic of the provider (Must use Redux)
│           ├── sub-components/ # fragmented UI if needed
│           └── sub-helpers/    # fragmented logic if needed
│
├── presentations/            # THE VIEW & VIEWMODEL LAYER (MVVM CORE)
│   └── [FeatureName]/        # e.g., Login/
│       ├── index.tsx         # THE VIEW: Functional component (UI only)
│       ├── use[Feature].ts   # THE VIEWMODEL: Handles state and business logic
│       ├── useApi[Feature].ts # THE MODEL: Handles API calls/data fetching
│       ├── sub-components/   # Internal fragmented UI components
│       └── sub-helpers/      # Internal logic helper functions
│
├── lib/                      # GLOBAL LOGIC LAYER
│   ├── hooks/                # Global reusable hooks
│   ├── helper/               # Global helper functions
│   └── utils/                # Global utilities
│       └── redux/            # Global Redux store/slices
│
└── middleware.ts             # ROUTE PROTECTION
    # public_route = ["login", etc]
    # If !public && !token -> redirect login
```

## 2. Layer Responsibilities

### app/ (The Router)
- **Rules**: No logic, no complex JSX. Only imports the Presentation component.
- **Example**: `import { LoginPresentation } from "@/presentations/Login"`

### presentations/ (MVVM Core)
- **View (`index.tsx`)**: Pure UI. Uses the feature's hook for state.
- **ViewModel (`use[Feature].ts`)**: Business logic, validation, state management.
- **Model (`useApi[Feature].ts`)**: API calls and raw data handling.

### components/Providers/
- **Rules**: Global state must use **Redux**.
- **Location**: Store logic in `src/lib/utils/redux`.

## 3. Mandatory Rules
1. **No Direct UI in `app/`**: Always use `presentations/`.
2. **Isolation**: Features must be self-contained in their presentation folder.
3. **Global Reusability**: Reusable logic belongs in `lib/`, reusable UI in `components/`.
