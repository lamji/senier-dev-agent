# Event Admin Template

## Overview
Admin Dashboard with analytical overviews, a filtered booking list (TanStack Table), and status management. Follows strict MVVM pattern and Admin MVP rules.

## MVVM Mapping

| File | Role | Description |
|------|------|-------------|
| `index.md` | **View** | Admin Dashboard — renders analytics and the booking table. |
| `useAdmin.md` | **ViewModel** | Logic for fetching bookings, status updates, and metric counts. |
| `AdminLayout.md` | **Layout** | Sidenav with exactly 2 links (Dashboard, Bookings) and Logout. |
| `sub-components/BookingTable.md` | **View Fragment** | Data table implementation using TanStack Table & Lucide icons. |

## Administrative Rules (Applied)
- **Maximum 2 Sidenav Links**: Dashboard (Analytics) and Bookings (Primary Feature).
- **Mandatory Logout**: Included in the sidebar footer.
- **Card Usage Restricted**: Replaced Shadcn `Card` components with flavored `div` containers for native layout control.

## Dependencies
- `@tanstack/react-table` — Powerful table state management
- `lucide-react` — Icons (LayoutDashboard, Calendar, LogOut, RefreshCw, etc.)
- `framer-motion` — Responsive animations
- `@/lib/axios` — Centralized API client
- `next-auth/react` — Authenticated session & sign out
- `date-fns` — Date formatting

## Analytics in Dashboard
By default, the dashboard should include:
- **Pending Actions**: Tasks requiring immediate attention.
- **Success Metrics**: Approved/Completed tasks.
- **Exceptions**: Canceled/Failed tasks.

## Key Rules
- View is for layout and composition only.
- ViewModel handles all async calls and state.
- **No `Card` component**: Use custom wrappers for metric displays.
- Tables must have pagination and sorting.
