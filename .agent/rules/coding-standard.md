# MVVM Coding Standards

## 0. CRITICAL RULES (MUST FOLLOW)
- **Strict Compliance**: The AI must NOT create its own folder structures, coding styles, or patterns. Strictly follow the project's defined standards.
- **Maximum File Length**: No file shall exceed **300 lines of code**. Large files must be refactored immediately.
- **No Long Lines**: Avoid excessively long lines of code. Keep code readable and properly formatted.
- **JSX Fragmentation**: If a component's JSX becomes too long or complex, it MUST be chopped into smaller components. These must be placed in a `sub-components` folder within that specific component's or feature's directory.
- **ViewModel/Hook Fragmentation**: If logic hooks or viewmodels become too long, complex logic must be moved to helper functions. These helpers must be placed in a `sub-helpers` folder within that specific directory.
- **Internal Organization**: All sub-components and sub-helpers must remain inside their parent folder (feature or component) to maintain strict isolation.
- **Mandatory Summarization**: After every significant task or file modification, the AI MUST provide a detailed summary of the changes to the USER.
- **DRY Philosophy (Don't Repeat Yourself)**: Always prioritize code reusability. If logic or UI patterns are repeated more than twice, they MUST be extracted into reusable templates, helpers, or hooks. Duplicate code increases technical debt and maintenance overhead.

- **Changelog Maintenance**: The AI MUST maintain a root `.logs.md` file for global project summaries. 
    - **Within a project**: A dedicated `.logs/` folder must be created for granular, detailed logs naming convention: `.logs/[date]-[feature-or-bug-name].md`.
    - These logs MUST be revisited during debugging to prevent repetitive bugs.
    - **HARD RULE — APPEND ONLY**: The AI must **NEVER** remove, overwrite, or replace previous log entries. New logs MUST be **appended** to the end of existing files. Destroying log history is a **CRITICAL VIOLATION**.
- **Correction Tracking**: The AI MUST maintain and ALWAYS revisit `.corrections` in the root directory.
- **Template Reusability**: The AI MUST maintain and use `.templates` in the root directory. When a feature or component is built (like a GlobalAlert), its structure should be templated here for easy reuse in future projects or modules.
- **Zero Missed Instructions**: The AI must NEVER miss a single instruction from the USER's prompt. Before starting work, the AI MUST:
    1. **Parse** the user's request and extract EVERY individual instruction/task.
    2. **Build a To-Do Checklist** listing all extracted tasks clearly.
    3. **Prompt the USER** with the checklist and ask for confirmation ("Good to go?") BEFORE executing.
    4. **Complete ALL items** on the checklist — no partial deliveries.
    5. **Verify** each item is done before declaring the task complete.
    - If the AI realizes mid-task that it missed an instruction, it MUST acknowledge the miss, add it to the to-do, and complete it before finishing.

This document outlines the rules and best practices for implementing the Model-View-ViewModel (MVVM) pattern in this project.


## 1. Core Principles
- **Separation of Concerns**: The UI (View) must be completely decoupled from the Business Logic (Model). The ViewModel acts as the bridge.
- **Data Binding**: Use data binding for communication between the View and ViewModel. Avoid manual event handlers in "code-behind" where possible.
- **Testability**: ViewModels must be unit-testable without any dependence on UI frameworks.

## 2. The Model
- **Responsibilities**: Holds data and business logic.
- **Dependencies**: Must NOT reference the View or ViewModel.
- **Validation**: Should handle its own data validation logic.
- **Immutability**: Prefer immutable data structures where possible.

## 3. The ViewModel
- **Responsibilities**: 
  - Exposes data from the Model in a form the View can consume.
  - Handles view logic and state (e.g., `IsLoading`, `ErrorMessage`).
  - Exposes Commands for user interactions (e.g., `SubmitCommand`).
- **Dependencies**: 
  - Must NOT reference the View directly.
  - Should communicate with the Model and Services/Repositories.
- **Notifications**: Must implement change notification mechanisms (e.g., `INotifyPropertyChanged` in .NET or Observables in JS) to update the View when properties change.

## 4. The View
- **Responsibilities**: Defines the structure, layout, and appearance of the UI.
- **Dependencies**: 
  - Should only reference the ViewModel via Data Binding.
  - Avoid logic in code-behind files (`.xaml.cs`, `.kt`, etc.). Code-behind should be limited to pure UI concerns (e.g., complex animations that can't be bound).
- **Interaction**: User actions (clicks, input) should trigger Commands on the ViewModel, not function calls.

## 5. Communication Rules
- **View -> ViewModel**: Data Binding (Two-way for inputs, One-way for display) and Commands.
- **ViewModel -> View**: Property Change Notifications and Events (or Messenger/EventAggregator for loose coupling).
- **ViewModel -> Model**: Direct method calls.
- **Model -> ViewModel**: Events or Callbacks.

## 6. Regression Prevention & Isolation
- **Component Isolation**: Ensure components and modules are self-contained. Changes to one component must NOT inadvertently affect others.
- **Scoped State**: Avoid global state where possible. Keep state specific to the ViewModel or Component that needs it.
- **Pure Functions**: Prefer pure functions for business logic to ensure predictable side-effect-free execution.
- **Style Isolation**: Use scoped CSS, CSS Modules, or strict naming conventions (BEM) to prevent style leakage.
- **API Boundaries**: Clearly define public interfaces for Services and ViewModels. Internal implementation details should remain hidden (Encapsulation).

## 6.1 Safe Refactor Checklist
- Add/verify tests or lightweight assertions before changes; keep a green safety net.
- Refactor in tiny steps (extract, rename, move) with checks between steps.
- Preserve behavior: do not change data shapes or side effects unless explicitly intended.
- Localize edits: keep logic in `/lib`, UI in components, side-effects in hooks; avoid cross-cutting moves.
- Measure impact when relevant: render counts (React DevTools), bundle size, and hot-path latency.
- DRY with intent: extract only when used 3+ times (aligns with scalability protocol), avoid premature abstraction.

## 7. Feature Development & Isolation
- **Create vs Update**: For new features, always CREATE new files (Models, ViewModels, Views). Never update existing business logic files to accommodate a new feature.
- **Directory Isolation**: Create a dedicated folder for each new feature. Never mix unrelated code in the same directory.
- **Strict Separation**: Avoid "touching" or modifying unrelated files. Integration should be limited to a single import/render line in the parent View.
- **Impact Audit**: Always check project `.logs` and previous flows to ensure new features don't regress or conflict with prior work.
- ████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████
- **Modular Integration**: Design features to be modular so they can be added or removed by deleting their folder and a single import line.

## 8. Troubleshooting & Port Recovery
**See**: `.agent/rules/troubleshooting.md` for detailed zombie process cleanup, port recovery, and runtime issue resolution.
## 9. Admin & UI Rules
- **UI Component Usage**:
  - **Forbid `Card` (Shadcn)**: Do NOT use the Shadcn `Card` component for layouts or grouping unless explicitly requested by the USER. Use native `div` with custom CSS or other layout components.
- **Admin Sidebar Defaults**:
  - **Maximum 2 Navigation Links**: By default, the admin sidenav MUST contain exactly two primary category links:
    1. **Dashboard**: Must contain relevant analytics and overviews specific to the MVP (e.g., total bookings, revenue, pending tasks).
    2. **Primary MVP Feature**: A link directly related to the core MVP functionality (e.g., "Bookings" for a booking system).
  - **Logout Mandatory**: A logout action MUST be present in the sidebar or header for all admin views.
- **Admin Tables**:
  - Tables should be clean, functional, and include necessary actions (Approve, Cancel, Edit) relevant to the MVP.
