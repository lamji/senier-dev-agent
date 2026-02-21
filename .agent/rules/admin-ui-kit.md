# OrbitNest Admin UI Kit Automation Rule

This document defines the interface and integration patterns for the OrbitNest Admin UI Kit. Use this as a reference when automating the migration or installation of this kit into any project.

## 核心原则 (Core Principles)
- **Zero Business Logic**: Components are "Dumb" and driven exclusively by props.
- **Data Mapping**: Business logic (API/DB mapping) must happen in the Host Project (ViewModel).
- **Glassmorphism Design**: High density, 10px blur, consistent rounded corners (3xl/2xl).
- **Interactive States**: MUST implement hover effects (`hover:bg-gray-50`) and smooth transitions (`transition-colors`, `transition-all`) on all clickable elements. Dropdowns must support clicking outside to close.

## 1. 基础配置 (Base Config)
The kit requires a global configuration object of type `AppIdentity`.

```typescript
interface AppIdentity {
  name: string;
  logo: string;
  copyright: string;
  subtitle?: string;    // Brand subtitle or app description
  footerText?: string;  // Extra footer branding
  theme: {
    primary: string;
    secondary: string;
    accent: string;
    glass: string;
    blur: string;
  };
}
```

## 2. 核心组件 (Core Components)

### `AdminLayout`
The root wrapper for the admin experience. Passes global actions down to the Header.
- **Base Props**: `identity: AppIdentity`, `navigation: NavigationGroup[]`, `user: UserProfile`, `children: React.ReactNode`
- **Dynamic Header Props**: `searchPlaceholder`, `onSearch`, `onThemeToggle`, `isDarkMode`
- **Menu Arrays**: `notifications`, `messages`, `settings` (Type: `DropdownMenuItem[]`)
- **Visibility Flags**: `showNotifications`, `showMessages`, `showSettings`, `showThemeToggle`, `showFooter`

### `Sidebar`
Dynamic navigation system.
- **Props**: `identity`, `navigation`.
- **Features**: Collapsible groups, badges, active path highlighting, dynamic icons.

### `Header`
Sticky top bar (Usually instantiated via `AdminLayout`).
- **Features**: Triggers search events, theme toggle events, and maps dropdown menus via props.

### `DashboardView`
Analytical summary layout with extensive slot support.
- **Props**:
  - `title?: string`, `subtitle?: string`: Top level headings.
  - `kpis: KPI[]`: Array of stats (Revenue, Costs, etc.).
  - `actions: HeaderAction[]`: Buttons injected into the top right (supports onClick, icons, variants).
  - `yearlyOrderRate: any[]`: Recharts compatible data array.
  - `topWidgets: DashboardWidget[]`: Inject custom components (e.g. `ClientStats`) at the top of the view.
  - `isDefaultTable: boolean`: Switch the entire view to a focused table layout.
  - `tableTitle: string`, `tableData: any[]`, `tableColumns: any[]`: Data for the default table mode.
  - `onViewRow`, `onUpdateRow`: Callbacks for table row interactions.
  - `chartsSlot?: React.ReactNode`: Inject custom chart visualizations here.
  - `extraSlot?: React.ReactNode`: Inject content below charts.
  - `showKpis?: boolean`, `showCharts?: boolean`: Visibility toggles.

### `RowActions`
A reusable interaction menu for table rows.
- **Props**: `onView`, `onUpdate`, `onDelete` (Type: `() => void`).
- **Design**: Sleek vertical "More" icon (Kebab menu) with glassmorphism dropdown.

## 3. 集成流程 (Integration Workflow)
1. **Scaffold**: Copy the component files into the target project.
2. **Configure**: Define a project-specific `admin-config.ts`.
3. **Wrap**: Use `AdminLayout` in your `layout.tsx` (App Router).
4. **Wire**: Pass data from your hooks/ViewModels into the presentation components (`DashboardView`, `TanStackTable`, etc.).

## 4. 类型定义 (Type Definitions)
Reference the source files for exact TypeScript interfaces:
- `NavigationGroup`, `NavigationItem`: Menu structures.
- `HeaderAction`: Action buttons for headers.
- `DropdownMenuItem`: Items for notification/settings menus.
- `KPI`: Stat card data structure.
- `Shipment`: Table data structure (Logistics specific).
