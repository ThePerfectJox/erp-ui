/**
 * The page shell.
 *
 * ```tsx
 * import { Layout } from './erp-ui-components/layout'
 * import type { SidebarGroup } from './erp-ui-components/layout'
 * ```
 *
 * `Layout` is what a screen is wrapped in: a collapsible navigation rail on the left
 * and the screen beside it. Give it the navigation as data and it builds the rail:
 *
 * ```tsx
 * const MENU: SidebarGroup[] = [
 *     { label: 'Purchasing', icon: purchasingIcon, links: [{ label: 'Orders', to: '/orders' }] },
 * ]
 *
 * <Layout menu={MENU}><PurchaseOrderScreen /></Layout>
 * ```
 *
 * -----------------------------------------------------------------------------
 * Two things to know before using it
 * -----------------------------------------------------------------------------
 * **It needs a router.** The links are `react-router-dom` `NavLink`s, so `Layout`
 * must be rendered inside a `<BrowserRouter>` or equivalent. This is the only
 * third-party dependency in the whole library and it is confined to
 * `Sidebar/SidebarSubMenu.tsx` — a twenty-line file to rewrite if you use something
 * else.
 *
 * **It does not own the routes.** `Layout` renders its children unconditionally.
 * Moving between the links changes the URL and the selected marker; what appears in
 * the content column is your route table's job.
 *
 * -----------------------------------------------------------------------------
 * The rail's own components
 * -----------------------------------------------------------------------------
 * `Sidebar`, `SidebarMenu` and `SidebarSubMenu` are exported as an escape hatch, not
 * as the normal path. Reach for them when the `SidebarGroup` model cannot express
 * what a rail needs — a badge on a group, a divider, a link that is not a route —
 * and assemble them the way `Layout` does. They coordinate through
 * `SidebarContext`, so they only work nested inside a `<Sidebar>`.
 */

export { default as Layout } from './Layout'
export type { LayoutProps } from './Layout'

export type { SidebarGroup, SidebarLink } from './core/types'

/* --- The rail, for assembling one by hand -------------------------------- */
export { default as Sidebar } from './Sidebar/Sidebar'
export type { SidebarProps } from './Sidebar/Sidebar'

export { default as SidebarMenu } from './Sidebar/SidebarMenu'
export type { SidebarMenuProps } from './Sidebar/SidebarMenu'

export { default as SidebarSubMenu } from './Sidebar/SidebarSubMenu'
export type { SidebarSubMenuProps } from './Sidebar/SidebarSubMenu'

export { useSidebar } from './Sidebar/SidebarContext'
export type { SidebarState } from './Sidebar/SidebarContext'
