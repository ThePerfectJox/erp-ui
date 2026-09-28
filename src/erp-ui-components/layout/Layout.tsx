import { useState } from 'react'
import type { ReactNode } from 'react'
import type { SidebarGroup } from './core/types'
import Sidebar from './Sidebar/Sidebar'
import SidebarMenu from './Sidebar/SidebarMenu'
import SidebarSubMenu from './Sidebar/SidebarSubMenu'
import './Layout.css'

export interface LayoutProps {
	/**
	 * The navigation tree. See {@link SidebarGroup}.
	 *
	 * Data rather than JSX children, so the application owns its own navigation and
	 * this component owns how a rail looks. Pass `[]` for a screen with no
	 * navigation — the rail still renders, collapsed, which keeps the content column
	 * in the same place as on every other screen.
	 */
	menu: readonly SidebarGroup[]

	/** The screen, rendered in the content column beside the navigation rail. */
	children?: ReactNode
}

/**
 * The page shell: a collapsible navigation rail and the screen beside it.
 *
 * ```tsx
 * <Layout menu={MENU}>
 *     <PurchaseOrderScreen />
 * </Layout>
 * ```
 *
 * The rail **pushes** the content rather than floating over it, so nothing is ever
 * hidden behind it and the screen simply has less room while it is open. That is
 * the right trade for a desktop ERP, where the rail is opened to navigate and then
 * closed again; an overlay would be better on a phone, and this layout does not try
 * to be both.
 *
 * -----------------------------------------------------------------------------
 * What this component owns, and what it does not
 * -----------------------------------------------------------------------------
 * It owns exactly one piece of state: whether the rail is open. Everything else is
 * delegated — each group tracks its own expansion (`SidebarMenu`), and the selected
 * link comes from the router matching the URL (`SidebarSubMenu`).
 *
 * It does **not** own the routes. `Layout` renders whatever you put in it,
 * unconditionally; pair it with your router's own route table.
 *
 * -----------------------------------------------------------------------------
 * Requires a router
 * -----------------------------------------------------------------------------
 * The links are `react-router-dom` `NavLink`s, so this must be rendered inside a
 * router — a `<BrowserRouter>` or equivalent — or it throws. It is the only
 * third-party dependency anywhere in this library, and it is confined to
 * `Sidebar/SidebarSubMenu.tsx`: swap that one 25-line file to use a different
 * router, or a plain `<a>`, and the dependency is gone.
 */
function Layout({ menu, children }: LayoutProps) {
	/* The rail starts closed. A dense ERP screen wants its full width on load, and
	 * the rail is opened when someone actually intends to navigate. */
	const [isSidebarOpen, setIsSidebarOpen] = useState(false)

	return (
		<div className="layout">
			<Sidebar isOpen={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
				{menu.map(group => (
					<SidebarMenu key={group.label} icon={group.icon} label={group.label}>
						{group.links.map(link => (
							<SidebarSubMenu key={link.to} label={link.label} to={link.to} />
						))}
					</SidebarMenu>
				))}
			</Sidebar>

			{/* <main>, so a screen reader can jump straight to the content and skip the
			  * navigation. It is the reason this is not two divs. */}
			<main className="layout-content">{children}</main>
		</div>
	)
}

export default Layout
