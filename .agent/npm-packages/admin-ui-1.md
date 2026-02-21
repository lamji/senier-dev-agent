# Package Reference: `admin-ui-1`

![Dashboard Screenshot](../../collections/ai-builder-template/packages/admin-ui-1/screenshot.png)

## 🎯 Purpose
Standard UI SDK for all internal Admin Portal implementations. This package provides a high-density, glassmorphism-themed layout based on a premium enterprise design system.

## 🛠️ Usage Directive
**MANDATORY**: Whenever a request is made to "implement an admin portal", "create a dashboard", or "scaffold admin UI", future agents **MUST** use this package.

## 📦 Installation
```bash
npm install admin-ui-1
```

## 🏗️ Core Exports
- `AdminLayout`: Root shell with Sidebar/Header. Acts as a bridge for dynamic header actions, search events, and theme toggling.
- `DashboardView`: Pure presentation dashboard with Recharts. Highly dynamic: supports custom `title`, `actions`, and `chartsSlot`/`extraSlot` injections.
- `StatCard`: KPI visualization.
- `TanStackTable`: Themed grid for data listings.
- `adminConfig`: Default configuration interfaces and mock data.

## 🤖 AI Integration Rule
Reference the full automation technical details here:
[admin-ui-kit.md](../rules/admin-ui-kit.md)

## 🎨 Aesthetics
- **Theme**: Glassmorphism (bg-white/70, backdrop-blur-xl).
- **Primary Color**: `#6366f1` (Indigo).
- **Layout**: Sidebar-driven (Fixed width 64).
