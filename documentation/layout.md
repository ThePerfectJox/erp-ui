# `layout/` — the page shell and navigation rail

`Layout` is what a screen is wrapped in: a collapsible navigation rail on the
left and the screen beside it. Give it the navigation as **data** and it builds
the rail.

```tsx
import { Layout } from './erp-ui-components/layout'
import type { SidebarGroup } from './erp-ui-components/layout'

const MENU: SidebarGroup[] = [
  {
    label: 'Purchasing',
    icon: purchasingIcon,
    links: [
      { label: 'Purchase orders', to: '/purchasing/orders' },
      { label: 'Requisitions', to: '/purchasing/requisitions' },
    ],
  },
]

<Layout menu={MENU}>
  <PurchaseOrderScreen />
</Layout>
```

## Two things to know before using it

- **It needs a router.** The links are `react-router-dom` `NavLink`s, so `Layout`
  must be rendered inside a `<BrowserRouter>` or equivalent. This is the only
  third-party dependency in the whole library, confined to
  `Sidebar/SidebarSubMenu.tsx` — a ~20-line file to rewrite for a different
  router or plain anchors.
- **It does not own the routes.** `Layout` renders its children unconditionally.
  Moving between links changes the URL and the selected marker; what appears in
  the content column is your route table's job.

## `Layout` props

| Prop | Type | Notes |
| --- | --- | --- |
| `menu` | `readonly SidebarGroup[]` | the navigation tree, as data. Pass `[]` for no nav — the rail still renders, collapsed |
| `children` | `ReactNode` | the screen, in the content column |

`Layout` owns exactly one piece of state: whether the rail is open (it starts
closed — a dense ERP screen wants its full width on load). Everything else is
delegated: each group tracks its own expansion, and the selected link comes from
the router matching the URL. The rail **pushes** the content rather than floating
over it, which is the right trade for a desktop ERP.

## Navigation types

```ts
interface SidebarLink { label: string; to: string }

interface SidebarGroup {
  label: string
  icon: string                        // an image URL — an imported .svg
  links: readonly SidebarLink[]
}
```

Exactly two levels deep, by design — a collapsed icon rail has no room for a
third.

## The rail's own components (an escape hatch)

`Sidebar`, `SidebarMenu` and `SidebarSubMenu` are exported for the case the
`SidebarGroup` model can't express — a badge on a group, a divider, a link that
isn't a route. Assemble them the way `Layout` does; they coordinate through
`SidebarContext`, so they only work nested inside a `<Sidebar>`.

| Export | Role |
| --- | --- |
| `Sidebar` (+ `SidebarProps`) | the `<aside>` rail; controlled via `isOpen`/`onOpenChange` |
| `SidebarMenu` (+ `SidebarMenuProps`) | one collapsible group (icon + label + children) |
| `SidebarSubMenu` (+ `SidebarSubMenuProps`) | one link — the `<NavLink>`, the only third-party dependency |
| `useSidebar` (+ `SidebarState`) | reads the rail's `{ isOpen, requestOpen }` from context |

`requestOpen` is deliberately one-way ("open"), not a toggle: when a collapsed
group is clicked, two handlers fire and both request "open" so they agree, and
clicking a group in the rail reopens the sidebar *and* expands that group so the
single click lands on the group's contents.

`Layout` composes them like this:

```tsx
<Sidebar isOpen={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
  {menu.map(group => (
    <SidebarMenu key={group.label} icon={group.icon} label={group.label}>
      {group.links.map(link => (
        <SidebarSubMenu key={link.to} label={link.label} to={link.to} />
      ))}
    </SidebarMenu>
  ))}
</Sidebar>
```

The content column is a `<main>`, so a screen reader can jump straight to it and
skip the navigation.
