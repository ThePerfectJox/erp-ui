import { createContext, useContext } from 'react'

/* Lets a menu group deep inside the tree read and expand the rail without
 * Layout having to thread props through every child it renders. */
export interface SidebarState {
    /** True when the rail is expanded and labels are visible. */
    isOpen: boolean
    /** Expands the rail. Calling it while already open does nothing, so it is
     *  safe for two handlers to fire it on the same click. */
    requestOpen: () => void
}

export const SidebarContext = createContext<SidebarState>({
    isOpen: true,
    requestOpen: () => {},
})

export function useSidebar(): SidebarState {
    return useContext(SidebarContext)
}
