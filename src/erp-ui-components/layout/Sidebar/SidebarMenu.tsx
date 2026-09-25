import { useState } from 'react'
import type { ReactNode } from 'react'
import { useSidebar } from './SidebarContext'

interface SidebarMenuProps {
    icon: string
    description: string
    children?: ReactNode
}

/* A group: the header row plus the submenu it opens. The header is the
 * dropdown trigger. */
function SidebarMenu({ icon, description, children }: SidebarMenuProps) {
    const { isOpen: isSidebarOpen, requestOpen } = useSidebar()
    const [isExpanded, setIsExpanded] = useState(false)

    /* A 48px rail has nowhere to put a submenu, so the group only ever counts
     * as expanded while the rail is open. Keeping this in one flag means the
     * CSS never has to un-do an expanded group in the collapsed state. */
    const isGroupExpanded = isSidebarOpen && isExpanded

    const handleClick = () => {
        if (!isSidebarOpen) {
            /* Collapsed: this click is also expanding the rail, so drop the
             * group open rather than toggling something nobody can see. */
            requestOpen()
            setIsExpanded(true)
            return
        }

        setIsExpanded(!isExpanded)
    }

    return (
        <li className={isGroupExpanded ? 'sidebar-group sidebar-group-expanded' : 'sidebar-group'}>
            <button
                type="button"
                className="sidebar-group-header"
                onClick={handleClick}
                aria-expanded={isGroupExpanded}
                /* Carries the label while the rail is collapsed and the text is hidden. */
                title={description}
            >
                <span className="sidebar-group-icon">
                    {icon && <img src={icon} alt="" />}
                </span>
                <span className="sidebar-group-label">
                    {description}
                </span>
                <span className="sidebar-group-chevron" aria-hidden="true" />
            </button>
            <ul className="sidebar-submenu">
                {children}
            </ul>
        </li>
    )
}

export default SidebarMenu
