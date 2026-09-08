# erp-ui

A hand-rolled React 19 + TypeScript component library for a business-ERP style
admin app — no UI framework or table/form library underneath. Everything in
`src/erp-ui-components/` is built from plain HTML elements and CSS custom
properties, styled as a light-mode-only, professional/dense ERP theme:
monochrome graphite on light chrome, at a 14px base. There is no brand hue —
the only colour on screen is semantic status.

Open [`MasterExample`](src/erp-ui-components/MasterExample.tsx) (wired up as
the app's only screen, in `src/App.tsx`) to see every component in one page.

## Quick start

```bash
npm install
npm run dev       # start the Vite dev server
npm run build      # tsc -b && vite build
npm run lint        # eslint .
npx tsc -b           # type-check only, no build output
```

## Project layout

```text
src/
  index.css                    global design tokens + base document styles
  App.tsx                      renders <MasterExample />
  erp-ui-components/
    erp-ui-settings.ts         project-wide behavioral defaults (see below)
    MasterExample.tsx          every module composed in one page — start here
    assets/                    shared SVG icons
    layouts/                   app shell: header, sidebar, content, footer
    modals/                    Modal + useModal
    data-table/                DataTable and friends
    forms/                     native-HTML-styled form fields
```

## Component module shape

Every folder under `erp-ui-components/` (`layouts/`, `modals/`, `data-table/`,
`forms/`) follows the same shape:

- **`index.ts`** — the barrel. Import from the module, not individual files:
  `import { Modal, useModal } from "./erp-ui-components/modals"`.
- **`index.css`** — the module's entire stylesheet, imported by its
  components as a side effect (`import "./index.css"`). Colours/radii/shadows
  are aliased from the global tokens in `src/index.css` into module-scoped
  `--erp-<module>-*` custom properties, each with a hard-coded fallback so the
  module still renders if it's ever used without the global sheet loaded.
- **One component per file**, PascalCase, `export default function`, props
  via a local `interface XProps` (or `type XProps = Omit<...>` when there's
  nothing to add beyond an `Omit`, which TypeScript-ESLint's
  `no-empty-object-type` rejects as an `interface extends`).
- **`<module>Utils.ts`** (data-table, forms) — plain functions and shared
  types, no React/JSX. Sorting, comparison, FormData conversion — anything
  that isn't rendering lives here, so the components stay focused on JSX and
  event wiring.
- **`<Module>Example.tsx`** — an end-to-end demo, not exported from the
  barrel. Render it directly to try that module by hand.

## Design tokens (`src/index.css`)

Single source of truth for colour, spacing, radius, shadow and typography,
as CSS custom properties on `:root`. Light mode only — there is no dark
theme; this is desktop office software, not a consumer app. Colour is
reserved for the brand and semantic status (success/warning/danger/info),
not decoration. There is no brand hue at all: `--color-primary` is a neutral
near-black (`#1a1a1a`) and carries every interactive role — filled buttons,
rails, selection, focus. A red button therefore *means* something, because it
is the only red thing in the room.

Four rules keep the palette usable:

1. **Everything that carries text clears WCAG AA (4.5:1)** on its own
   background — including `--color-text-muted` on the table header fill and
   `--color-chrome-fg-muted` on the sidebar. `#1a1a1a` on white is 17.4:1, and
   white on it is the same, so `--color-primary` is safe as fill *and* as text
   — a saturated brand colour needs two tones to manage that.
2. **Every neutral is a true grey: R, G and B are equal at every step.** This
   is load-bearing, not pedantry. A "graphite" carrying even a few points more
   blue than red (`#1f242c`, say) reads as *navy* on a real screen, most
   obviously at button size — which defeats the point of having no brand hue.
   If you retheme, keep the spread at zero or the greys will pick a side.
3. **Nothing is distinguished by hue alone**, because there is no hue to
   distinguish it by. Links are underlined at rest (colour can no longer mark
   them), the selected table row carries a rail and a weight bump, the sorted
   column carries a rule. The one tight spot is `--color-primary-soft`: the
   selected row and the hovered row separate on tone alone, so the rail is
   doing the real work there rather than reinforcing a colour difference.
4. **The status hues that remain sit far apart on the wheel** — blue 224° ·
   violet 262° · green 142° · amber 30° · red 0° — so a row's state is legible
   from its colour alone, not only from its label.

`--color-primary-hover` goes *lighter* than the base, not darker: on a
near-black fill, darkening barely registers.

Type is set at a **14px base** (`--text-md`), the density business software is
actually read at; `--text-lg`/`--text-xl`/`--text-2xl` climb from there, and
`--weight-*` covers 400–700. Small all-caps labels (table headers, sidebar
group names, fieldset legends) use `--tracking-wide`; headings use
`--tracking-tight`.

Module stylesheets never hard-code a global colour — they alias it:

```css
--erp-modal-surface: var(--color-surface, #ffffff);
```

To retheme the app, edit `src/index.css`; every module picks the change up
automatically.

### Buttons

`src/index.css` styles the bare `button` element, so a plain `<button>` — a
modal's Cancel, say — is already a house button rather than an OS one. Two
modifier classes cover the rest, and they are the only *filled* buttons in the
system, so on any screen the affirmative action and the destructive one each
stand alone:

```html
<button>Cancel</button>                            <!-- neutral, outlined -->
<button class="button-primary">Save</button>       <!-- filled graphite -->
<button class="button-danger">Delete</button>      <!-- filled red -->
```

Forms keep their own `.form-submit-button` (see `forms/`), which is the same
filled-graphite treatment applied by `SubmitButton` without needing a class at
the call site.

## `erp-ui-settings.ts`

Cross-cutting *behavioral* defaults that shouldn't be a per-call-site prop —
e.g. "does clicking the backdrop dismiss a modal?" is a house policy, not a
decision every screen should make separately:

```ts
export const erpUiSettings = {
  modal: {
    closeOnBackdropClick: true,
    closeOnEsc: true,
  },
};
```

---

## `layouts/`

The app shell: a fixed header with a sidebar toggle, a collapsible sidebar of
grouped nav links, a scrollable main content area, and a fixed footer.

```tsx
import { Layout, SidebarGroup, SidebarList } from "./erp-ui-components/layouts";

<Layout
  sidebarGroups={[
    <SidebarGroup key="inventory" description="Inventory" icon={icon} defaultExpanded list={[
      <SidebarList key="items" description="Items" />,
      <SidebarList key="stock" description="Stock levels" />,
    ]} />,
  ]}
  content={<h1>Dashboard</h1>}
/>
```

- **`Layout`** owns the sidebar open/closed state itself (no external hook)
  and clones each `sidebarGroups` element with the current `sidebarOpen` plus
  an `onRequestSidebarOpen` callback. The callback is deliberately one-way
  ("open"), not the toggle — a group can only ever be clicked from the rail,
  where the only useful outcome is opening.
- **Collapsing doesn't hide the sidebar, it narrows it to a 3.5rem icon rail**
  (`--erp-sidebar-rail-width`). Every group icon stays on screen and stays
  clickable, and clicking one reopens the sidebar *and* expands that group, so
  the single click a rail affords lands on the group's contents. The label and
  chevron are `display: none` at that width; `SidebarGroup` re-attaches the
  name as `title`/`aria-label` while collapsed so the row isn't an unlabelled
  target. A group given no `icon` renders its first initial instead, which is
  visible only in the rail.
- **`SidebarGroup`** is its own collapsible section (`defaultExpanded` to
  start it open). Passing `sidebarOpen={false}` (done automatically by
  `Layout` when the sidebar collapses) hides its list and switches the header
  into its rail presentation.
- **`SidebarList`** is one row; wrap it in a real `<a href="#section">` (as
  `MasterExample`'s `NavLink` does) for anchor-jump navigation — the
  `:focus-visible` outline in `index.css` covers both the plain-div and the
  anchor-wrapped case.
- Header/sidebar/footer are fixed-position and each scroll independently —
  the page itself never scrolls; `<main>` does.

## `modals/`

A controlled dialog *container* — it decides whether to show `children`, and
nothing about what's inside.

```tsx
import { Modal, useModal } from "./erp-ui-components/modals";

const dialog = useModal();

<button onClick={dialog.onOpen}>Open</button>
<Modal open={dialog.open} onClose={dialog.onClose} ariaLabelledBy="title">
  <MyDialogContent onCancel={dialog.onClose} />
</Modal>
```

- `useModal()` covers the open/close boilerplate (`open`, `onOpen`,
  `onClose`, `toggle`).
- `Modal` has no `size`/width prop — sizing is the content's job (set your
  own `max-width` on whatever you render inside), the same rule every module
  here follows: the *container* never dictates the size of what a caller puts
  inside it.
- Portals into `document.body`, traps focus, restores it on close, and
  dismisses on Escape / backdrop click per `erpUiSettings.modal`.

## `data-table/`

A sortable, checkbox-selectable, inline-editable table. Accepts an array or
a dictionary of rows plus a column list; everything else (sort, edit,
select, the action bar) is handled internally.

```tsx
import { DataTable } from "./erp-ui-components/data-table";

const [rows, setRows] = useState(products);
const [selected, setSelected] = useState<Product[]>([]);

<DataTable
  data={rows}
  columns={[
    { key: "name", label: "Name", editable: true },
    { key: "price", label: "Price", editable: true },
    { key: "inStock", label: "In stock" },
  ]}
  getRowId={(row) => row.id}
  onSelectionChange={(rows) => setSelected(rows)}
  actions={<DeleteButton selected={selected} onDelete={(ids) => ...} />}
/>
```

- Every column header sorts (click cycles none → asc → desc → none); only
  columns marked `editable` render a live `<input>` cell.
- Editing a cell auto-checks its row; unchecking a row's checkbox reverts
  that row's edits back to the original data (same rule for "select all").
- `actions` is a plain `ReactNode` the caller builds and wires entirely
  outside `DataTable` — `onSelectionChange` is the only channel between them.
- The table scrolls sideways inside its own container; there's no
  height/max-height set, so vertical overflow just grows the page normally.
- `DataTableColumn`/`DataTableRow`/`DataTableCell` are the internal pieces
  `DataTable` composes — exported for reuse, but you'd normally just use
  `DataTable` itself.

## `forms/`

Every field component has one fixed prop shape — `id`, `name`, `label`,
`hint`, `placeholder` where each applies — and renders its own
label/control/hint markup; there's no `className` prop anywhere in this
module, so every element always carries exactly the one class it ships with.
`id` falls back to `useId()` when omitted, same as elsewhere in this library.

```tsx
import {
  TextInput, TextArea, NumberInput, DateInput,
  RadioGroup, CheckboxGroup, Combobox,
  FormSection, FormRow, SubmitButton,
} from "./erp-ui-components/forms";

<form>
  <FormSection title="Personal details" description="Basic info.">
    <FormRow>
      <TextInput name="name" label="Name" required />
      <Combobox name="department" label="Department" options={departments} />
    </FormRow>
  </FormSection>

  <RadioGroup name="type" label="Type" options={[{ label: "Full-time", value: "ft" }]} />
  <CheckboxGroup name="benefits" label="Benefits" hint="Select all that apply." options={benefitOptions} />

  <SubmitButton label="Save" onSubmitValues={(values) => console.log(values)} />
</form>
```

- **`TextInput` / `NumberInput` / `DateInput` / `TextArea`** — `id`, `name`,
  `label`, `hint?`, `placeholder?`, plus what each needs to actually hold a
  value: `value?`/`defaultValue?`/`onChange?`/`required?`/`disabled?`
  (`NumberInput` also takes `min?`/`max?`/`step?`; `TextArea` takes `rows?`).
  Uncontrolled by default (`defaultValue`), controllable via `value`+
  `onChange` like any input.
- **`RadioGroup` / `CheckboxGroup`** — `id`, `name`, `label` (rendered as the
  `<fieldset>`'s `<legend>` — the border is the native fieldset, not CSS
  pretending), `hint?`, and `options: { label, value }[]`. No `placeholder`
  — a group of options doesn't have one. `CheckboxGroup` takes
  `defaultValues?: string[]` (plural) and submits repeated values as an
  array, not last-one-wins; `RadioGroup` takes a single `defaultValue?`.
- **`Combobox`** — same shape as `TextInput` plus `options: (string | {
  label, value })[]` — a dropdown-with-text-input via a `<datalist>`
  (`list` attribute), the browser's own autocomplete, not a hand-built
  widget.
- **`FormSection`** — `title`, `description?`, `children` — a heading over
  whatever fields you nest inside. Not part of the id/name/label/hint shape;
  it groups fields, it isn't one.
- **`FormRow`** — `children` only. Lays them side by side at desktop widths
  (≥768px) and stacks them below that. Pure CSS, no JS breakpoint detection.
- **`SubmitButton`** — `id?`, `label` (its button text), `disabled?`,
  `onSubmitValues?`. Given `onSubmitValues`, it listens on the owning
  `<form>`'s native `submit` event (found via `button.form`, no ref plumbing
  needed) and hands you a plain object built from `FormData` — repeated
  field names (a checkbox group) become an array. Listening on `submit`
  rather than the button's `click` matters: native constraint validation
  (`required`, `min`/`max`, `pattern`) runs *before* `submit` fires, so it
  isn't bypassed, and it also fires correctly when the form is submitted by
  pressing Enter.
- **`formsUtils.ts`** also exports `getFormValues`/`formDataToObject`
  directly, if you want to wire your own `<form onSubmit>` instead of using
  `SubmitButton`.

---

## Conventions for adding to this library

- Match the module shape above: barrel, tokenized `index.css`, one
  component per file, logic that isn't rendering goes in `<module>Utils.ts`.
- Tabs for indentation, double quotes, semicolons.
- Compositional props — pass `ReactNode`/`ReactElement`s in as props rather
  than building compound-component/context APIs.
- `verbatimModuleSyntax` is on: use `import type`/`export type` for
  type-only imports. `erasableSyntaxOnly` is on: no enums, no parameter
  properties — use string-literal unions instead.
- Keep code comments short and only for non-obvious "why" — longer
  explanation belongs in this README, not a file-header essay.
- Verify with `npx tsc -b` and `npm run lint` before considering a change
  done.
