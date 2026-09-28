import { NavLink } from 'react-router-dom'

export interface SidebarSubMenuProps {
	/** The link text. */
	label: string

	/** Route path. */
	to: string
}

/**
 * One link in a menu group.
 *
 * **The library's only third-party dependency, and it is confined to this file.**
 * Everything else in `erp-ui-components` needs nothing but React. If you are
 * copying the folder into a project that uses a different router — or none — this is
 * the one component to rewrite, and it is twenty lines: swap `NavLink` for your
 * router's equivalent, or for a plain `<a href={to}>`.
 *
 * `NavLink` is used rather than `Link` for one reason: it adds `class="active"` to
 * the anchor when the route matches, which is what the stylesheet hangs the selected
 * background and the brand-blue left marker on. So the selected state is derived
 * from the URL rather than kept in state anywhere — there is nothing to get out of
 * step. The cost is that the styling depends on that class name, which is a router
 * implementation detail; `Sidebar.css` says so where it uses it.
 */
function SidebarSubMenu({ label, to }: SidebarSubMenuProps) {
	return (
		<li className="sidebar-submenu-item">
			<NavLink to={to}>{label}</NavLink>
		</li>
	)
}

export default SidebarSubMenu
