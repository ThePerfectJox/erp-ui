# Architecture

How `erp-ui` is organized, and the conventions every module follows. This page
is for people changing the library. To use it, start with
[getting-started.md](./getting-started.md); to restyle it, see
[customization.md](./customization.md).

## The two layers of the project

```text
src/
  main.tsx                  React entry point
  App.tsx                   navigation data + the app shell
  PurchaseOrderScreen.tsx   the demo screen (not part of the library)
  PurchaseOrderScreen.css
  erp-ui-components/         the component library — the reusable unit
```

Everything reusable lives in `src/erp-ui-components/`. The files directly under
`src/` (`App.tsx`, `PurchaseOrderScreen.tsx`) are the demo application that
consumes the library — they are the example, not the product.

### Entry points

- **`src/main.tsx`** — mounts React in `StrictMode`, wraps the app in a
  `<BrowserRouter>` (the router the sidebar needs), and imports
  `./erp-ui-components/styles/index.css` as the application's one and only
  global stylesheet. It then renders `<App />`.
- **`src/App.tsx`** — declares the navigation tree as data (`MENU:
  SidebarGroup[]`) and renders `<Layout menu={MENU}><PurchaseOrderScreen /></Layout>`.
  There is deliberately no route table: the demo shows the same screen for
  every link, so clicking a link moves the selected marker and the URL without
  swapping content.
- **`src/PurchaseOrderScreen.tsx`** — a representative ERP maintenance screen
  that exercises every control in one place. See
  [`demo-screen.md`](./demo-screen.md).

## The library folder

`erp-ui-components/index.ts` is the public barrel. It imports the theme, then
re-exports every module:

```ts
import './styles/index.css'

export * from './shared'
export * from './chart'
export * from './form'
export * from './layout'
export * from './overlay'
export * from './sheet'
export * from './table'
```

| Folder | Holds | Docs |
| --- | --- | --- |
| `styles/` | design tokens, base element styles, the visually-hidden helper | [styles.md](./styles.md) |
| `shared/` | primitives used by more than one module | [shared.md](./shared.md) |
| `form/` | twelve controls, the form shell, and the field system behind them | [form.md](./form.md) |
| `table/` | `ViewTable` — a read-only report table | [table.md](./table.md) |
| `sheet/` | `DataGrid` — an Excel-like editable grid | [sheet.md](./sheet.md) |
| `chart/` | bar, line and donut charts, drawn by hand in SVG | [chart.md](./chart.md) |
| `overlay/` | `Modal`, built on the native `<dialog>` | [overlay.md](./overlay.md) |
| `layout/` | the page shell and its navigation rail | [layout.md](./layout.md) |
| `assets/` | the handful of SVG icons the layout needs | — |

## The shape every module folder shares

Learning your way around one module teaches you the rest. Each component module
is built in the same layers, with dependencies pointing strictly inward:

```text
<module>/
  index.ts        the public API — the barrel. Import from here, not from files.
  <Component>.tsx one component per file
  core/           pure logic. No React, no DOM, no state.
  hooks/          behavior and state.
  parts/          internal presentational pieces, not exported.
  styles or .css  the look.
```

- **`core/`** — pure functions belonging to *one* component family (grid
  selection geometry, chart scales, page arithmetic). No React. The part worth
  reading first when something misbehaves. Re-exported from the barrel so a
  component the library doesn't ship can be built on the same primitives.
- **`hooks/`** — the behavior and state. Some are public (`useFormField`,
  `useTablePagination`), some are internal and shaped around one component's
  composition (the eight `sheet` hooks).
- **`parts/`** — small presentational pieces the top-level component composes.
  Almost always internal; not re-exported from the module barrel.
- **`index.ts`** — the public API. Anything not exported from a module's barrel
  is internal and shaped around its current callers, not around being reusable.

### One shared exception: sorting

Sorting lives in `shared/sortRows`, not in a module's `core/`, because both
`table/ViewTable` and `sheet/DataGrid` need the identical comparator. Keeping
one copy is what stops two tables on one screen disagreeing about where blank
cells sort. See [shared.md](./shared.md).

### Inside `DataGrid`

`sheet/DataGrid.tsx` is wiring and markup only. The behaviour is eight
internal hooks, the pure logic is five `core/` modules (`types`, `cellValue`,
`clipboard`, `gridSelection`, `gridSizing`), and the markup is five `parts/`.
The hooks are composed in dependency order:

```text
useGridSizing → useGridView → useGridDirtyRows → useGridWriter
  → useGridSelection → useGridEditing → useGridClipboard → useGridKeyboard
```

Everything the user does is in visual coordinates (position on screen);
everything written back is in source coordinates (position in `rows`).
`useGridView` produces `GridViewRow { row, sourceIndex }` to bridge the two,
and `useGridWriter` is the single write path: typing, paste and Delete all
become one `writeBlock` call that maps visual to source, skips read-only
columns, diffs values before marking a row dirty, then calls `onChange` and
publishes the dirty set. Sorting is a view: `useGridView` freezes the order so
an edited row doesn't jump mid-keystroke.

## Import styles

Two equivalent ways to import, both supported:

```tsx
// From the library barrel — convenient, one import site.
import { Button, DataGrid, BarChart } from './erp-ui-components'

// From a module barrel — better tree-shaking on some bundlers; what the demo does.
import { Button } from './erp-ui-components/form'
import { DataGrid } from './erp-ui-components/sheet'
```

Import from a module's `index.ts`, never from an individual file inside it.

## Copying the library into another project

The `erp-ui-components/` folder is self-contained — it carries its own tokens
and base styles. To reuse it elsewhere:

1. **Load the theme once, from your entry point**, before anything else:
   `import './erp-ui-components/styles/index.css'`. (Importing from the barrel
   pulls it in too, so this is strictly optional — but doing it explicitly puts
   the tokens at the head of the cascade.)
2. **Provide a router if you use `Layout`.** Its sidebar links are
   `react-router-dom` `NavLink`s — the only third-party dependency anywhere in
   the library, confined to `layout/Sidebar/SidebarSubMenu.tsx`.

The one thing that is *not* self-contained: the `.svg` imports in `assets/`
resolve to URLs through a bundler that understands them (Vite does out of the
box).

## Conventions for adding to the library

- Match the module shape above: barrel, tokenized CSS, one component per file,
  logic that isn't rendering goes in `core/`.
- Tabs for indentation, single quotes in TypeScript (double quotes in JSX
  attributes), no semicolons.
- Compositional props — pass `ReactNode`/`ReactElement`s in as props rather
  than building compound-component/context APIs.
- `verbatimModuleSyntax` is on: use `import type`/`export type` for type-only
  imports. `erasableSyntaxOnly` is on: no enums, no parameter properties — use
  string-literal unions instead.
- Keep code comments short and only for the non-obvious "why".
- Verify with `npx tsc -b` and `npm run lint` before considering a change done.
