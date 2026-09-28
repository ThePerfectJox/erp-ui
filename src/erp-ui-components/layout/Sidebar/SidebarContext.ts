import { createContext, useContext } from 'react'

/**
 * What a menu group needs to know about the rail around it.
 *
 * Context rather than props, because the alternative is `Layout` threading two
 * values through every group it renders — and `Sidebar` takes its groups as
 * `children`, so it cannot inject them even if it wanted to.
 */
export interface SidebarState {
	/** True when the rail is expanded and labels are visible. */
	isOpen: boolean

	/**
	 * Expands the rail. Deliberately not a toggle.
	 *
	 * Two handlers fire on the same click when a collapsed group is pressed — the
	 * group's own, and the rail's click-anywhere shortcut. Both ask only for "open",
	 * so they agree; if either were a toggle they would cancel each other out and
	 * the rail would flicker and stay shut.
	 */
	requestOpen: () => void
}

export const SidebarContext = createContext<SidebarState>({
	/* Open, so a `SidebarMenu` rendered outside a `<Sidebar>` still expands rather
	 * than being permanently stuck shut. That is the forgiving reading of a
	 * mistake — the mistake being rendering one without a provider.
	 *
	 * Note it differs from `Layout`'s initial state, which is closed. Nothing reads
	 * this default in normal use; it exists so a group in isolation degrades to
	 * something usable instead of something inert. */
	isOpen: true,
	requestOpen: () => {},
})

export function useSidebar(): SidebarState {
	return useContext(SidebarContext)
}
