# Product Definition Tool PRD (v1)

## 1. Product Summary

- **Product name:** Product Definition Tool
- **Audience:** Product owners, solution architects, business analysts, implementation consultants who need to define configurable products without engineering help.
- **Primary value:** Visually design product structures (sections, fields, logic) and persist them as internal JSON templates, treating “product definitions as configuration, not code,” with no external export in v1.

---

## 2. Goals, Non-Goals, and Scope

### Goals (v1)

- Enable non-technical users to create and edit product definitions through a drag-and-drop, WYSIWYG designer.
- Provide a structured internal JSON template model that captures sections, fields, validation, and visibility/logic in a consistent way.
- Support reusability via a Question Library so common fields can be standardized across products.
- Run entirely client-side (HTML/JS/CSS with LocalStorage) to keep setup simple and data local during design.

### Non-Goals (v1)

- No external schema export (no JSON Schema, YAML, or template file downloads) in v1; all export items are deferred to a future phase.
- No real-time multiplayer collaboration or comments; users work sequentially on a shared browser profile or per-user LocalStorage.
- No backend persistence or authentication beyond simple in-browser demo login used for role simulation.

---

## 3. UX and User Flows

### 3.1 Workspace Layout

- **Left rail – Product Explorer:**
  - List of products with search and filters; “New Product” button; status chips (Draft/Published/Archived).
- **Center – Visual Designer Canvas:**
  - Sections rendered as large cards; fields as reorderable rows or pills; instant WYSIWYG representation of the product structure.
- **Right rail – Property Studio:**
  - Contextual panel with tabs (*Field*, *Section*, *Product*, *Logic*) that updates based on current selection.
- **Top bar:**
  - Product name inline-editable; current version dropdown; role badge (Admin/Editor/Viewer); “Save” and “Save as Version” actions only (no export).

### 3.2 Create Product Flow

- Click **“New Product”** in the left rail to open a modal with: Name, Description, Category, optional “Start from existing product”.
- On creation, a default first section (“Basic Details”) appears with onboarding hints and ghost text (“Drag a field from the toolbox to begin”).
- First-time users see a sample product with tooltips pointing out Product Explorer, Toolbox, Canvas, and Property Studio to reduce learning friction.

### 3.3 Drag-and-Drop Designer

- **Toolbox (floating panel):**
  - Groups: *Basic* (Text, Number, Boolean), *Choice* (Enumeration, Multi-select), *Temporal* (Date, DateTime), *Advanced* (Reference, File), *Layout* (Section, Divider, Group).
- **Interactions:**
  - Drag fields into sections; drop indicators animate and auto-scroll; keyboard users can “pick up” and move fields via keys.
  - Hover over a field to reveal micro-controls: drag handle, duplicate, hide/show toggle, delete.
- **Property Studio:**
  - When a field is selected, show:
    - **Basics:** Label, key (auto-suggested; uniqueness enforced), description, tooltip.
    - **Validation:** Required, data-type-specific constraints (min/max, pattern, etc.).
    - **Display:** Control style (e.g., toggle vs checkbox), placeholder, helper text.

### 3.4 Visibility & Logic Builder

- **Design principle:** All visibility and conditional logic is stored in the internal JSON model, not just in UI state.
- **Rule builder UI:**
  - For a selected field or section, a “Visibility & Logic” panel allows adding rules like “Show when [field] [operator] [value]”.
  - Users can combine conditions with “All of” (AND) and “Any of” (OR) groups, displayed as nested, pill-style conditions.
- **Representation:**
  - Rules are displayed in the canvas as subtle badges (“Visible if: Employment Status = Employed”) to keep logic discoverable.

### 3.5 Question Library

- Access via top nav “Question Library” link and via “Insert from Library” within field configuration.
- Library screen:
  - Left filters for type/tags; center list of question cards showing label, type, usage count; right preview of visual representation and JSON snippet of the template.
- Save any field as a **Library Question** with canonical name, description, and tags; consumers can clone it into products while maintaining a link to the original entry for reference (even though changes do not auto-propagate in v1).

### 3.6 Versioning

- Manual **“Save as Version”** button captures a snapshot of the product configuration as an immutable version.
- Version history modal lists versions with author (demo user), timestamp, and a short change note (optional).
- Older versions are view-only; users can “Restore as new draft,” which clones that configuration as the latest editable version.

---

## 4. Functional Requirements

### 4.1 Product & Section Management

- Create, read, update, and soft-delete products; each product has metadata (id, name, description, category, tags, status, timestamps, currentVersionId).
- Sections support: id, title, description, order, layout type (1-column / 2-column), and per-section visibility rules.
- Reordering sections must update the internal JSON ordering and reflect immediately in the canvas.

### 4.2 Field System

- Supported types: Text, Number, Boolean, Date, DateTime, Enumeration, Multi-select, Reference, File.
- Common attributes (for all fields): id, key, label, type, required, default, description, tooltip, visibilityRuleIds.
- Type-specific configuration:
  - Text: minLength, maxLength, pattern.
  - Number: integer/decimal flag, min, max, step.
  - Boolean: displayStyle (toggle/checkbox), default.
  - Date/DateTime: min, max, format.
  - Enumeration/Multi-select: array of options (label, value, optional color, default flag).
  - Reference: target entity key, display field, value field.
  - File: allowed MIME types, maxSize, multiple flag.

### 4.3 Logic & Visibility Model

- Rules stored as structured objects referencing fields/sections by id, e.g. a condition tree with operators like equals, notEquals, in, greaterThan, lessThan.
- Engine must evaluate visibility for each field/section given a hypothetical “data state” (this prepares for future preview/renderer integration).
- Circular dependencies (field A depends on B which depends on A) must be detected and flagged with a validation warning.

### 4.4 Question Library

- Maintain a separate JSON collection of library questions with id, name, type, schema fragment, tags, createdBy, usage count.
- When inserting from library, create a cloned field instance in the product; storing the libraryQuestionId for traceability (but no live linkage).
- Library entries can be archived but not hard-deleted if referenced by any product.

### 4.5 Security & Roles

- Simple login screen that lets users select demo accounts: Admin, Editor, Viewer, with role badges shown in the top bar.
- Permissions:
  - Admin: Full access including product delete and library management.
  - Editor: Create/edit products and fields, use the library, create new library questions; cannot permanently delete products.
  - Viewer: Read-only; cannot change configuration; all editing affordances (drag handles, inputs) are disabled.

---

## 5. Non-Functional Requirements

- **Performance:** The app should remain responsive (sub-second interactions) for up to 50 products and 1,000 fields in aggregate on a modern browser.
- **Persistence:** Use LocalStorage with a namespaced key and schemaVersion; migrations run automatically on load if schemaVersion changes between releases.
- **Accessibility:** Keyboard navigation for toolbox, canvas, and Property Studio; distinct focus indicators; descriptive labels for icons and controls.
- **Responsiveness:** Optimized for desktop (≥1280px); tablet supports basic editing; mobile is view-only and hides advanced panels.

---

## 6. Technical Architecture

- **Frontend:** Single-page app built with HTML5 and vanilla ES6 modules; separate modules for state, models, UI components, and logic evaluation.
- **Styling:** Custom design system using CSS variables for color, spacing, and typography; support for light/dark themes in the future.
- **State management:** Central store module with pub/sub style updates; each component subscribes to slices of state to avoid unnecessary re-renders.
- **Persistence layer:** Single LocalStorage adapter responsible for reading/writing JSON templates and library data, abstracting raw LocalStorage access.

---

## 7. Roadmap (Post-v1, Not in Scope Now)

- External export of product definitions as JSON templates and/or JSON Schema/YAML for integration with external systems.
- Embedded form renderer that uses the internal JSON model and logic engine to generate interactive forms for preview and runtime use.
- Live collaboration, comments, and change suggestions for larger organizations.
