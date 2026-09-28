/**
 * The navigation model.
 *
 * -----------------------------------------------------------------------------
 * Why this exists at all
 * -----------------------------------------------------------------------------
 * `Layout` used to spell its entire menu out as literal JSX — three groups called
 * "Menu 1", "Menu 2" and "Menu 3", each with two "Sub Menu" links pointing at
 * `/menu-1/sub-menu-1` and friends. That made the component a *screen* rather than
 * a layout: copying this folder into another project shipped someone else's
 * navigation tree with it, and changing a menu entry meant editing a library file.
 *
 * Describing the menu as data instead puts the boundary back where it belongs. The
 * application owns its navigation, the library owns how a rail looks and behaves,
 * and neither has to know much about the other.
 *
 * ```tsx
 * const MENU: SidebarGroup[] = [
 *     {
 *         label: 'Purchasing',
 *         icon: purchasingIcon,
 *         links: [
 *             { label: 'Purchase orders', to: '/purchasing/orders' },
 *             { label: 'Requisitions', to: '/purchasing/requisitions' },
 *         ],
 *     },
 * ]
 *
 * <Layout menu={MENU}>
 *     <PurchaseOrderScreen />
 * </Layout>
 * ```
 */

/** One link inside a menu group. */
export interface SidebarLink {
	/** Text shown in the rail. */
	label: string

	/**
	 * Route path, passed to the router's `NavLink`.
	 *
	 * The selected state comes from the router matching this against the current
	 * URL, so it is not something the caller keeps in state.
	 */
	to: string
}

/**
 * One expandable group in the rail.
 *
 * Exactly two levels deep — a group and its links — and that is a deliberate
 * ceiling rather than an unfinished feature. A 48px collapsed rail has nowhere to
 * show a third level, and a navigation tree that needs one is usually a navigation
 * tree that wants rethinking rather than another nesting level.
 */
export interface SidebarGroup {
	/**
	 * Text beside the icon, and the tooltip while the rail is collapsed and the
	 * text is hidden.
	 */
	label: string

	/**
	 * Icon URL — what importing an `.svg` resolves to.
	 *
	 * ```tsx
	 * import warehouseIcon from './icons/warehouse.svg'
	 * ```
	 *
	 * A URL rather than a node, because the rail renders it as an `<img>` with an
	 * empty `alt`: the group's label is right next to it when the rail is open and
	 * is its tooltip when closed, so the icon is decoration either way.
	 */
	icon: string

	links: readonly SidebarLink[]
}
