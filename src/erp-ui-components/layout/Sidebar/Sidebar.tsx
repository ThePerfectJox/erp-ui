import { useMemo } from 'react'
import type { ReactNode } from 'react'
import collapseIcon from '../../assets/menu.svg'
import expandIcon from '../../assets/menu-close.svg'
import { SidebarContext } from './SidebarContext'
import './Sidebar.css'

interface SidebarProps {
    isOpen: boolean
    onOpenChange: (isOpen: boolean) => void
    children?: ReactNode
}

function Sidebar({ isOpen, onOpenChange, children }: SidebarProps) {
    const state = useMemo(
        () => ({
            isOpen,
            requestOpen: () => onOpenChange(true),
        }),
        [isOpen, onOpenChange]
    )

    /* While collapsed the whole rail opens it, not just the button — clicking
     * anywhere in the empty space below the menu works too.
     *
     * A click on a menu group inside also bubbles up to here, and that group
     * asks to open as well. Both only ever ask for "open", never "toggle", so
     * the two requests agree instead of cancelling each other out. */
    const handleRailClick = () => {
        if (!isOpen) {
            onOpenChange(true)
        }
    }

    return (
        <SidebarContext.Provider value={state}>
            <aside
                className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}
                onClick={handleRailClick}
            >
                <div className="sidebar-header">
                    {/* The button stays because it is the only way to *close*
                     * the rail, and the only keyboard-reachable target. */}
                    <button
                        type="button"
                        className="sidebar-toggle"
                        onClick={() => onOpenChange(!isOpen)}
                        aria-expanded={isOpen}
                        aria-label={isOpen ? 'Collapse menu' : 'Expand menu'}
                    >
                        <img src={isOpen ? collapseIcon : expandIcon} alt="" />
                    </button>
                </div>
                <ul className="sidebar-menu">
                    {children}
                </ul>
            </aside>
        </SidebarContext.Provider>
    )
}

export default Sidebar
