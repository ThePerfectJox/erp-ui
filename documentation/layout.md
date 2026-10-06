# Layout

## What it is

`Layout` is the page shell: a collapsible navigation rail on the left and your
screen in a `<main>` content area beside it. You describe the navigation as
data and `Layout` builds the rail.

- The rail starts closed as a 48px strip of group icons, and opens to 240px.
  Opening it pushes the content over (it doesn't cover it).
- Each group expands to show its links. The link for the current URL is
  highlighted.
- The rail stays fixed while the page scrolls.

The links are `react-router-dom` `NavLink`s, so `Layout` must be inside a
router. `Layout` doesn't choose which screen to show; that's your route table.

```tsx
import { Layout } from './erp-ui-components/layout'
import type { SidebarGroup } from './erp-ui-components/layout'
```

## How to use it

### Basic setup

```tsx
// main.tsx
import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
```

```tsx
// App.tsx
import { Route, Routes } from 'react-router-dom'
import { Layout } from './erp-ui-components/layout'
import type { SidebarGroup } from './erp-ui-components/layout'
import purchasingIcon from './icons/purchasing.svg'
import inventoryIcon from './icons/inventory.svg'

const MENU: SidebarGroup[] = [
  {
    label: 'Purchasing',
    icon: purchasingIcon,
    links: [
      { label: 'Purchase orders', to: '/purchasing/orders' },
      { label: 'Requisitions', to: '/purchasing/requisitions' },
    ],
  },
  {
    label: 'Inventory',
    icon: inventoryIcon,
    links: [{ label: 'Stock overview', to: '/inventory/stock' }],
  },
]

function App() {
  return (
    <Layout menu={MENU}>
      <Routes>
        <Route path="/purchasing/orders" element={<OrderList />} />
        <Route path="/purchasing/requisitions" element={<RequisitionList />} />
        <Route path="/inventory/stock" element={<StockOverview />} />
      </Routes>
    </Layout>
  )
}
```

Navigation is two levels: groups and links. Group labels must be unique, and
link `to` values must be unique within a group (they're used as React keys).

### Behaviour

- Click the menu button at the top of the rail to open or close it.
- When the rail is closed, clicking anywhere on it opens it. Clicking a group
  icon opens the rail and expands that group, so the next click is the link.
- Groups expand and collapse independently.
- The current link (matched by the router) is shown in blue with a bar on the
  left.

## API reference

### `Layout`

| Prop | Type | Description |
| --- | --- | --- |
| `menu` | `readonly SidebarGroup[]` | Required. The navigation. Pass `[]` for none; the closed rail still shows. |
| `children` | `ReactNode` | The screen, rendered in `<main class="layout-content">`. |

`Layout` has no `className` and no prop for the rail's open state. It always
starts closed. For control over that, [build a custom rail](#building-a-custom-rail).

### Navigation types

```ts
interface SidebarGroup {
  label: string                    // group name
  icon: string                     // image URL, e.g. an imported .svg
  links: readonly SidebarLink[]
}

interface SidebarLink {
  label: string                    // link text
  to: string                       // route path
}
```

Icons are shown at 20×20px as `<img>`. A monochrome SVG works best.

## How to customize

### With variables

The rail has five of its own variables, set on `.sidebar`. They are
semi-transparent black so they work on any light background colour. For a dark
rail, use white at the same alphas.

| Variable | Default | Used for |
| --- | --- | --- |
| `--sidebar-shade-group` | `rgba(0, 0, 0, 0.03)` | background of an expanded group |
| `--sidebar-shade-hover` | `rgba(0, 0, 0, 0.06)` | hovered row |
| `--sidebar-shade-selected` | `rgba(0, 0, 0, 0.11)` | current link |
| `--sidebar-shade-selected-hover` | `rgba(0, 0, 0, 0.16)` | current link, hovered |
| `--sidebar-line` | `rgba(0, 0, 0, 0.10)` | hairlines inside the rail |

And these global tokens:

| Token | Used for |
| --- | --- |
| `--color-chrome-bg` | rail background |
| `--color-chrome-border` | right edge of the rail |
| `--color-chrome-fg` | link and group text |
| `--color-chrome-active` | current link text and bar |
| `--space-5` | padding around the content area |

Example: a dark blue rail.

```css
.layout .sidebar {
  --color-chrome-bg: #1d2d3e;
  --color-chrome-fg: #eaecee;
  --color-chrome-active: #ffffff;
  --color-chrome-border: #1d2d3e;
  --color-text: #ffffff;   /* expanded group heading */

  --sidebar-shade-group: rgba(255, 255, 255, 0.04);
  --sidebar-shade-hover: rgba(255, 255, 255, 0.08);
  --sidebar-shade-selected: rgba(255, 255, 255, 0.14);
  --sidebar-shade-selected-hover: rgba(255, 255, 255, 0.2);
  --sidebar-line: rgba(255, 255, 255, 0.12);
}
```

The menu toggle icons are dark images (`assets/menu.svg`,
`assets/menu-close.svg`). On a dark rail, replace them or add
`.layout .sidebar-toggle img { filter: invert(1); }`.

### With CSS classes

```text
div.layout
  aside.sidebar.sidebar-open | .sidebar-closed
    div.sidebar-header
      button.sidebar-toggle > img
    ul.sidebar-menu
      li.sidebar-group(.sidebar-group-expanded)
        button.sidebar-group-header
          span.sidebar-group-icon > img
          span.sidebar-group-label
          span.sidebar-group-chevron
        ul.sidebar-submenu
          li.sidebar-submenu-item > a(.active)
  main.layout-content
```

| Class | Element |
| --- | --- |
| `.layout` | outer flex container (at least full viewport height) |
| `.layout-content` | the `<main>` content area |
| `.sidebar`, `.sidebar-open`, `.sidebar-closed` | the rail and its state (240px / 48px) |
| `.sidebar-header`, `.sidebar-toggle` | top bar and its open/close button |
| `.sidebar-menu` | list of groups (scrolls when tall) |
| `.sidebar-group`, `.sidebar-group-expanded` | one group |
| `.sidebar-group-header`, `.sidebar-group-icon`, `.sidebar-group-label`, `.sidebar-group-chevron` | group button parts |
| `.sidebar-submenu`, `.sidebar-submenu-item` | link list |
| `.sidebar-submenu-item a.active` | current link (`active` is added by `NavLink`) |

None of the layout components take a `className`. Scope your rules under
`.layout` so they win over the library's single-class rules:

```css
/* A wider rail when open */
.layout .sidebar-open { width: 280px; }

/* More room around screens */
.layout .layout-content { padding: var(--space-6); }

/* A centred, max-width content column */
.layout .layout-content > * { max-width: 80rem; margin-inline: auto; }
```

Don't change the closed width (48px). The icon positions are calculated from
it.

## Building a custom rail

`Sidebar`, `SidebarMenu` and `SidebarSubMenu` are exported for cases the
`SidebarGroup` data can't express: a rail that starts open, a badge on a group,
a divider, extra content. This is how `Layout` composes them:

```tsx
import { useState } from 'react'
import { Sidebar, SidebarMenu, SidebarSubMenu } from './erp-ui-components/layout'

function AppShell({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)   // start open

  return (
    <div className="layout">
      <Sidebar isOpen={isOpen} onOpenChange={setIsOpen}>
        <SidebarMenu icon={purchasingIcon} label="Purchasing (3)">
          <SidebarSubMenu label="Purchase orders" to="/purchasing/orders" />
          <SidebarSubMenu label="Requisitions" to="/purchasing/requisitions" />
        </SidebarMenu>
      </Sidebar>
      <main className="layout-content">{children}</main>
    </div>
  )
}
```

The `.layout` and `.layout-content` classes come from `Layout.css`, which is
loaded when the layout module is imported.

| Export | Props | Description |
| --- | --- | --- |
| `Sidebar` | `isOpen: boolean`, `onOpenChange: (isOpen: boolean) => void`, `children` | The `<aside>` rail with the toggle button. Controlled. |
| `SidebarMenu` | `icon: string`, `label: string`, `children` | One expandable group. Tracks its own expanded state. Must be inside `Sidebar`. |
| `SidebarSubMenu` | `label: string`, `to: string` | One link (`<li>` + `NavLink`). |
| `useSidebar()` | | Returns `{ isOpen, requestOpen() }` for your own rail content. `requestOpen` only opens. |

Types: `LayoutProps`, `SidebarProps`, `SidebarMenuProps`,
`SidebarSubMenuProps`, `SidebarState`, `SidebarGroup`, `SidebarLink`.

### Without react-router

`layout/Sidebar/SidebarSubMenu.tsx` is the only file in the library that
imports `react-router-dom`. To use another router, or plain links, rewrite it.
Keep the `active` class on the current link so the highlight still works:

```tsx
export interface SidebarSubMenuProps {
  label: string
  to: string
}

function SidebarSubMenu({ label, to }: SidebarSubMenuProps) {
  const isActive = window.location.pathname === to

  return (
    <li className="sidebar-submenu-item">
      <a href={to} className={isActive ? 'active' : undefined} aria-current={isActive ? 'page' : undefined}>
        {label}
      </a>
    </li>
  )
}

export default SidebarSubMenu
```

The rail's icons come from `.svg` imports in `layout/Sidebar/Sidebar.tsx`,
which need a bundler that resolves them to URLs (Vite does).
