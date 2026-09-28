# erp-ui

A React 19 + TypeScript component library for a business-ERP style
admin app — no UI framework, no table/form/chart library underneath. Everything
in `src/erp-ui-components/` is built from plain HTML elements and CSS custom
properties, styled as a light-mode SAP Fiori ("Morning Horizon") theme at a 14px
base: one interaction blue, filled fields, and semantic status colour.

Open [`PurchaseOrderScreen`](src/PurchaseOrderScreen.tsx) — wired up as the app's
only screen in [`src/App.tsx`](src/App.tsx) — to see every component composed in
one page.

## Quick start

```bash
npm install
npm run dev       # start the Vite dev server
npm run build     # tsc -b && vite build
npm run lint      # eslint .
npx tsc -b        # type-check only, no build output
```

Stack: React 19.2, react-dom 19.2, react-router-dom 7.18, Vite 8, TypeScript
~6.0.

## Project layout

```text
src/
  main.tsx                  React entry — StrictMode, BrowserRouter, the theme
  App.tsx                   navigation data + the app shell
  PurchaseOrderScreen.tsx   the demo screen — every component in one page
  erp-ui-components/        the component library
    index.ts                the public barrel
    styles/                 design tokens, base element styles, a11y helper
    shared/                 primitives used by more than one module
    form/                   twelve controls + the field system
    table/                  ViewTable — a read-only report table
    sheet/                  DataGrid — an Excel-like editable grid
    chart/                  bar, line and donut charts, hand-drawn in SVG
    overlay/                Modal, built on the native <dialog>
    layout/                 the page shell and its navigation rail
    assets/                 the SVG icons the layout needs
```

## What's in the box

| Module | Import | What it gives you |
| --- | --- | --- |
| **form** | `./erp-ui-components/form` | `Form`, `FormSection`, `FormRow`, `FormActions`, `MessageStrip`, `Button`, and 11 field controls (`TextInput`, `NumberInput`, `DateInput`, `TextArea`, `Select`, `ComboBox`, `RadioGroup`, `CheckboxGroup`, `Checkbox`, `Switch`, `FileInput`) |
| **table** | `./erp-ui-components/table` | `ViewTable` (read-only report table), `TablePagination`, `useTablePagination` |
| **sheet** | `./erp-ui-components/sheet` | `DataGrid` (editable spreadsheet grid) |
| **chart** | `./erp-ui-components/chart` | `BarChart`, `LineChart`, `DonutChart` |
| **overlay** | `./erp-ui-components/overlay` | `Modal` |
| **layout** | `./erp-ui-components/layout` | `Layout`, `Sidebar` and its parts |
| **shared** | `./erp-ui-components/shared` | `classNames`, the sort comparator, `useOutsidePointerDown` |
| **styles** | `./erp-ui-components/styles/index.css` | the theme — load once, first |

You can import from the library barrel (`from './erp-ui-components'`) or from a
module barrel (`from './erp-ui-components/form'` — better tree-shaking, and what
the demo does). Always import from a barrel, never from a file inside a module.

## Full documentation

Detailed docs, one file per module, live in [`documentation/`](documentation/):

- **[architecture.md](documentation/architecture.md)** — how the project is
  organized and the shape every module follows. **Start here.**
- **[styles.md](documentation/styles.md)** — the design tokens and the Fiori
  theme
- **[shared.md](documentation/shared.md)** — `classNames`, `sortRows`,
  `useOutsidePointerDown`
- **[form.md](documentation/form.md)** — the twelve controls, the field system,
  and the structure components
- **[table.md](documentation/table.md)** — `ViewTable` and paging
- **[sheet.md](documentation/sheet.md)** — `DataGrid`, its hooks and core
- **[chart.md](documentation/chart.md)** — the three charts and their building
  blocks
- **[overlay.md](documentation/overlay.md)** — `Modal`
- **[layout.md](documentation/layout.md)** — the page shell and navigation rail
- **[demo-screen.md](documentation/demo-screen.md)** — a walkthrough of
  `PurchaseOrderScreen`

## Which table do I want?

`table/ViewTable` is for **reading**: rows sorted, sometimes ticked, clicked
through to a detail screen. Cells can hold anything, and columns size to their
content.

`sheet/DataGrid` is for **editing**: cells typed into, selected as ranges and
copied to Excel, columns dragged to a width. Everything in a cell is text.

If the user types into it, `DataGrid`. If they read it, `ViewTable`. They share
their sort comparator (`shared/sortRows`) and nothing else.

## Conventions

- Every module folder has the same shape: a barrel `index.ts` (the public API),
  a tokenized stylesheet, one component per file, pure logic in `core/`, behavior
  in `hooks/`, internal presentational pieces in `parts/`.
- Tabs for indentation, double quotes, semicolons.
- `verbatimModuleSyntax` and `erasableSyntaxOnly` are on: use `import
  type`/`export type`, and no enums or parameter properties (string-literal
  unions instead).
- Verify with `npx tsc -b` and `npm run lint` before considering a change done.

See [architecture.md](documentation/architecture.md#conventions-for-adding-to-the-library)
for the full list.
