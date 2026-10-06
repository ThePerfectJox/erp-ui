# The demo screen — `PurchaseOrderScreen`

`src/PurchaseOrderScreen.tsx` is a representative ERP maintenance screen that
exercises every control in one place. It is **a demo, not part of the library**
— it lives in `src/`, not in `erp-ui-components/` — and it's the fastest way to
see whether a change to the tokens or a stylesheet has broken something.

It also shows how the pieces compose on a real screen, which is worth reading
before building your own.

## How the app wires up to it

`src/App.tsx` declares the navigation as data and renders the shell:

```tsx
const MENU: SidebarGroup[] = [ /* Purchasing, Inventory, Master data */ ]

function App() {
  return (
    <Layout menu={MENU}>
      <PurchaseOrderScreen />
    </Layout>
  )
}
```

There's deliberately no route table — every link shows the same screen, so
clicking one moves the selected marker and the URL without swapping content.

## What the screen demonstrates

### Every form control, in a real layout

A `<Form labelPlacement="beside" noValidate>` with several `<FormSection>`s and
`<FormRow>`s holding `TextInput`, `Select`, `DateInput`, `ComboBox`,
`NumberInput`, `RadioGroup`, `CheckboxGroup`, `Switch`, `Checkbox`, `FileInput`
and `TextArea`, closed by a `<FormActions>` of `Button`s. `noValidate` is set
because the screen reports its own `valueState` — otherwise the browser would
show a second, differently styled message for the same problem.

The `FormActions` shows all three ways to give a `Button` a mark: an imported
`.svg` URL (an `<img>`, keeps its own fill — right on a white button), a node
(inherits the button's text colour — right on a filled button), and a logo-only
button that requires `aria-label` to compile.

### An editable grid derived into charts

`ITEM_COLUMNS` is a `GridColumn[]` feeding a `<DataGrid>`. It includes a
**derived** `total` column — read-only, `format`ted from `netValueOf(row)`, with
a `sortValue` so it sorts by the real number rather than doing nothing:

```tsx
{
  key: 'total', header: 'Net value', width: 120, type: 'number',
  isReadOnly: true,
  format: (_unused, row) => netValueOf(row).toFixed(2),
  sortValue: netValueOf,
}
```

The three charts (`BarChart`, `LineChart`, `DonutChart`) are all computed from
the grid's own rows — `netValues`, `runningTotals(netValues)`, and value grouped
by material prefix. Nothing is a separate copy, so editing a quantity in the grid
moves the bars, the line and the donut on the same keystroke.

### A read-only report table

`RECEIPT_COLUMNS` is a `TableColumn[]` feeding a `<ViewTable>` of posted goods
receipts. It shows the features a report needs that a grid can't offer:

- a `render` column producing a `<StatusBadge>` (with a real text label, not
  colour alone) and another producing an `<a>` link (the accessible,
  keyboard-navigable route to the detail screen)
- a `sortValue` that sorts the status column by workflow stage, not
  alphabetically
- `hideBelow` on columns that drop out on a narrow screen
- a `footerRow` with a page total, and paging composed from
  `useTablePagination` + `<TablePagination>`

### A modal holding a whole grid

The delete confirmation is a `<Modal size="large">` rendered **outside** the
`<Form>` (a dialog renders in the top layer, so nesting a form's worth of
controls inside another form's element tree risks Enter submitting the wrong
one). Its children are a `MessageStrip` and a read-only `<DataGrid>` of the items
to be deleted — the modal owns the frame and knows nothing about what's inside.

## The helper functions worth copying

- **`netValueOf(row)`** — an item's net value (quantity × price), defined once
  and used by the grid's derived column, the charts and the modal, so the three
  can't disagree.
- **`runningTotals(values)`** — a module-level function, not an accumulator
  threaded through a `map` (which the React compiler would flag, and which can
  survive into the next render and double the totals).
- **`materialGroupOf(row)`** — maps a material-number prefix to its group, for
  the donut.

## The save flow

The dirty set is controlled from the screen, so the save flow can clear the marks
— and only once the server has accepted them:

```tsx
const [dirtyItems, setDirtyItems] = useState<Map<string, RowChangeKind>>(new Map())

// on submit, after the request resolves:
setDirtyItems(new Map())
```

Because `DataGrid` already splits changes into `"added"` and `"edited"`, a real
save is just:

```ts
const added  = [...dirtyItems].filter(([, kind]) => kind === 'added')
const edited = [...dirtyItems].filter(([, kind]) => kind === 'edited')
await Promise.all([postItems(added), patchItems(edited)])
```

## Screen-level styling

`src/PurchaseOrderScreen.css` shows how to style your own screens around the
library: it defines only new `po-*` classes built from tokens (a card with
`--color-surface`, `--radius-lg` and `--shadow-sm`; an uppercase eyebrow; a
two-column chart grid; status badges using the `--color-*-soft` pairs). It
doesn't override any library class or token. For overriding the library
itself, see [customization.md](./customization.md).

The entry point `src/main.tsx` imports the theme
(`./erp-ui-components/styles/index.css`) before `App` and wraps the app in a
`<BrowserRouter>`, which `Layout` needs.
