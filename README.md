# erp-ui

A React 19 + TypeScript component library for business (ERP) screens: forms,
report tables, an Excel-like editable grid, charts, dialogs and a page shell
with navigation. It's built from plain HTML and CSS custom properties, with no
UI, table, form or chart library underneath, and styled as a light SAP Fiori
"Morning Horizon" theme.

The library lives in [`src/erp-ui-components/`](src/erp-ui-components/). The
demo screen [`src/PurchaseOrderScreen.tsx`](src/PurchaseOrderScreen.tsx) uses
every component on one page.

## Quick start

```bash
npm install
npm run dev       # dev server with the demo screen
npm run build     # tsc -b && vite build
npm run lint      # eslint .
```

```tsx
// src/main.tsx: load the theme once, first
import './erp-ui-components/styles/index.css'
```

```tsx
import { Form, FormSection, FormRow, TextInput, Button } from './erp-ui-components/form'

<Form onSubmit={save}>
  <FormSection title="Supplier">
    <FormRow>
      <TextInput label="Name" name="name" isRequired />
      <TextInput label="Email" name="email" type="email" />
    </FormRow>
  </FormSection>
  <Button variant="emphasized" type="submit">Save</Button>
</Form>
```

## Documentation

Start here:

- [Getting started](documentation/getting-started.md): what the library is,
  setup, your first screen, and the conventions every component shares
- [Customization](documentation/customization.md): props, design tokens,
  scoped themes, CSS class hooks, a dark theme, and the limits

Components, one page each. Every page explains what the component is, how to
use it (with examples and a full prop reference), and how to customize it.

| Module | Components | Docs |
| --- | --- | --- |
| form | `Form`, `FormSection`, `FormRow`, `FormActions`, `MessageStrip`, `Button`, `TextInput`, `NumberInput`, `DateInput`, `TextArea`, `Select`, `ComboBox`, `RadioGroup`, `CheckboxGroup`, `Checkbox`, `Switch`, `FileInput` | [form.md](documentation/form.md) |
| table | `ViewTable`, `TablePagination`, `useTablePagination` | [table.md](documentation/table.md) |
| sheet | `DataGrid` | [sheet.md](documentation/sheet.md) |
| chart | `BarChart`, `LineChart`, `DonutChart` | [chart.md](documentation/chart.md) |
| overlay | `Modal` | [overlay.md](documentation/overlay.md) |
| layout | `Layout`, `Sidebar`, `SidebarMenu`, `SidebarSubMenu` | [layout.md](documentation/layout.md) |
| styles | design tokens, base styles | [styles.md](documentation/styles.md) |
| shared | `classNames`, sorting helpers, `useOutsidePointerDown` | [shared.md](documentation/shared.md) |

Also:

- [Demo screen walkthrough](documentation/demo-screen.md)
- [Architecture](documentation/architecture.md): how the source is organized,
  for contributors

## Which table do I want?

- [`ViewTable`](documentation/table.md) for reading: sort, tick rows, click
  through. Cells can hold badges, links and buttons.
- [`DataGrid`](documentation/sheet.md) for editing: type into cells, select
  ranges, copy and paste with Excel.

## Contributing

- Every module has the same shape: `index.ts` (public API), one component per
  file, pure logic in `core/`, state in `hooks/`, internal pieces in `parts/`,
  and a stylesheet that only reads tokens.
- Tabs, single quotes, no semicolons. `import type` for type-only imports; no
  enums (use string-literal unions).
- Run `npx tsc -b` and `npm run lint` before considering a change done.

Details in [architecture.md](documentation/architecture.md).
