# Getting started

## What is erp-ui?

`erp-ui` is a React 19 + TypeScript component library for building business
(ERP) screens: maintenance forms, item tables, report lists, dashboards and
confirmation dialogs. It's styled as a light-mode SAP Fiori "Morning Horizon"
theme at a 14px base.

It has no UI framework underneath. No table library, form library or chart
library either. Every component is plain HTML elements plus CSS custom
properties, so there is one design system and one place to change it (the
[design tokens](./styles.md)).

What you get:

| Module | Components | Use it for |
| --- | --- | --- |
| [form](./form.md) | `Form`, `FormSection`, `FormRow`, `FormActions`, `MessageStrip`, `Button`, `TextInput`, `NumberInput`, `DateInput`, `TextArea`, `Select`, `ComboBox`, `RadioGroup`, `CheckboxGroup`, `Checkbox`, `Switch`, `FileInput` | data entry |
| [table](./table.md) | `ViewTable`, `TablePagination` | read-only lists and reports |
| [sheet](./sheet.md) | `DataGrid` | Excel-like editable tables |
| [chart](./chart.md) | `BarChart`, `LineChart`, `DonutChart` | small dashboards and analysis panels |
| [overlay](./overlay.md) | `Modal` | dialogs |
| [layout](./layout.md) | `Layout`, `Sidebar`, `SidebarMenu`, `SidebarSubMenu` | the page shell and navigation rail |
| [styles](./styles.md) | design tokens, base styles | theming |
| [shared](./shared.md) | `classNames`, sorting helpers, `useOutsidePointerDown` | helpers used across modules |

Everything is accessible by default: every field has a real label, every table
and chart has a caption, charts render their data as a hidden table for screen
readers, and the modal uses the native `<dialog>`.

## Requirements

- React 19 and react-dom 19
- `react-router-dom` 7, but only if you use `Layout` (its links are `NavLink`s)
- A bundler that turns `import icon from './x.svg'` into a URL. Vite does this
  out of the box.

## Installation

The library is a folder, not an npm package. It lives at
`src/erp-ui-components/` and is self-contained.

In this repo:

```bash
npm install
npm run dev       # dev server with the demo screen
npm run build     # type-check + production build
npm run lint
```

In another project, copy `src/erp-ui-components/` into your `src/` folder and
install the peer dependencies:

```bash
npm install react react-dom react-router-dom
```

## Step 1: load the theme once

Import the theme in your entry file, before anything else. It holds the design
tokens every component reads.

```tsx
// src/main.tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './erp-ui-components/styles/index.css'   // first
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>   {/* only needed for Layout */}
      <App />
    </BrowserRouter>
  </StrictMode>
)
```

Component stylesheets are imported by the components themselves. You never
import them by hand.

## Step 2: import components

Import from a module barrel (recommended, it's what the demo does):

```tsx
import { Form, FormSection, FormRow, TextInput, Button } from './erp-ui-components/form'
import { ViewTable } from './erp-ui-components/table'
```

Or from the library barrel, which re-exports everything:

```tsx
import { Form, TextInput, ViewTable, Modal } from './erp-ui-components'
```

Don't import from a file inside a module (for example
`./erp-ui-components/form/controls/TextInput`). Only what the barrel exports is
public API.

## Step 3: build a screen

A small but complete screen: a page shell, a form, a list and a dialog.

```tsx
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Layout } from './erp-ui-components/layout'
import type { SidebarGroup } from './erp-ui-components/layout'
import {
  Button, Form, FormActions, FormRow, FormSection, MessageStrip,
  NumberInput, Select, TextInput,
} from './erp-ui-components/form'
import { ViewTable } from './erp-ui-components/table'
import type { TableColumn } from './erp-ui-components/table'
import { Modal } from './erp-ui-components/overlay'
import ordersIcon from './icons/orders.svg'

const MENU: SidebarGroup[] = [
  {
    label: 'Purchasing',
    icon: ordersIcon,
    links: [{ label: 'Purchase orders', to: '/orders' }],
  },
]

const PLANTS = [
  { value: '1000', label: '1000 · Hamburg' },
  { value: '2000', label: '2000 · Munich' },
]

const COLUMNS: TableColumn[] = [
  { key: 'id', header: 'Order', isNoWrap: true },
  { key: 'supplier', header: 'Supplier' },
  { key: 'net', header: 'Net value', type: 'number', format: value => Number(value).toFixed(2) },
]

const ORDERS = [
  { id: '4500001827', supplier: 'Acme Steel', net: 2845.5 },
  { id: '4500001828', supplier: 'Nordic Parts', net: 412 },
]

function OrderScreen() {
  const [supplier, setSupplier] = useState('')
  const [isSaved, setIsSaved] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsSaved(true)
  }

  return (
    <>
      {isSaved && (
        <MessageStrip valueState="success" isLive>
          Purchase order saved.
        </MessageStrip>
      )}

      <Form labelPlacement="beside" onSubmit={handleSubmit} noValidate>
        <FormSection title="Header">
          <FormRow>
            <TextInput
              label="Supplier"
              name="supplier"
              value={supplier}
              onChange={event => setSupplier(event.target.value)}
              isRequired
            />
            <Select label="Plant" name="plant" options={PLANTS} placeholder="Select a plant" />
          </FormRow>
          <FormRow>
            <NumberInput label="Quantity" name="quantity" unit="EA" min={0} />
          </FormRow>
        </FormSection>

        <FormActions>
          <Button variant="negative" onClick={() => setIsDeleteOpen(true)}>Delete</Button>
          <Button variant="emphasized" type="submit">Save</Button>
        </FormActions>
      </Form>

      <ViewTable caption="Recent orders" hasRowCount columns={COLUMNS} rows={ORDERS} getRowId={row => String(row.id)} />

      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete this order?"
        size="small"
        footer={
          <>
            <Button variant="transparent" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="negative" onClick={() => setIsDeleteOpen(false)}>Delete</Button>
          </>
        }
      >
        <p>This cannot be undone.</p>
      </Modal>
    </>
  )
}

export default function App() {
  return (
    <Layout menu={MENU}>
      <OrderScreen />
    </Layout>
  )
}
```

For a much larger example that uses every component, read
[`src/PurchaseOrderScreen.tsx`](../src/PurchaseOrderScreen.tsx) and its
walkthrough in [demo-screen.md](./demo-screen.md).

## Conventions you'll see in every component

Learn these once and every component's props become predictable.

- Boolean props start with `is`, `has`, `are` or `can`: `isRequired`,
  `isDisabled`, `isReadOnly`, `hasRowCount`, `canGrowOnPaste`. They are all off
  by default unless the docs say otherwise.
- Visible names are required. Every field needs a `label`, and every table,
  grid, chart and modal needs a `caption` or `title`. If you don't want to show
  it, pass `isLabelHidden` or `isCaptionHidden`. The text stays available to
  screen readers.
- Value states are one shared vocabulary: `'error' | 'warning' | 'success' |
  'information'`. They're used by fields (`valueState`) and by `MessageStrip`.
- Controlled or uncontrolled. Inputs accept `value` + `onChange` (controlled)
  or `defaultValue` (uncontrolled), just like native elements. Tables accept
  `sort` + `onSortChange` or `defaultSort`, and so on. `DataGrid` and `Modal`
  are controlled only.
- Native props pass through. Text-like inputs accept any attribute a native
  `<input>`, `<textarea>` or `<select>` accepts (`placeholder`, `maxLength`,
  `autoComplete`, `onBlur`...).
- `className` is accepted by most top-level components, and it is added
  alongside the component's own classes. Each module doc says which element it
  lands on.

## Next steps

- [customization.md](./customization.md): theming, scoped overrides, CSS class
  hooks, and what you can and can't change
- The module docs, one per folder, listed in the table at the top
- [architecture.md](./architecture.md): how the source is organized, for
  contributors
