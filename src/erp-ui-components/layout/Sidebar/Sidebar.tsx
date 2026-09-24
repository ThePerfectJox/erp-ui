import type { ReactNode } from 'react'

interface SidebarChildrenProps {
    isOpen: boolean
}

interface SidebarProps {
    isOpen: boolean
    children?: ReactNode
}

function Sidebar({ isOpen, children }: SidebarProps) {
    return (
        <aside className="sidebar">
            <ul className="sidebar-menu">
                {children}
            </ul>
        </aside>
    )
}

export default Sidebar