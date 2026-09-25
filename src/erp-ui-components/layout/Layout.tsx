import { useState } from 'react'
import type { ReactNode } from 'react'
import warehouseIcon from '../assets/warehouse.svg'
import Sidebar from './Sidebar/Sidebar'
import SidebarMenu from './Sidebar/SidebarMenu'
import SidebarSubMenu from './Sidebar/SidebarSubMenu'
import './Layout.css'

interface LayoutProps {
    /** The screen, rendered in the content column beside the navigation rail. */
    children?: ReactNode
}

function Layout({ children }: LayoutProps) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return <div className="layout">
        <Sidebar isOpen={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SidebarMenu icon={warehouseIcon} description="Menu 1">
                <SidebarSubMenu description="Sub Menu 1" link="/menu-1/sub-menu-1" />
                <SidebarSubMenu description="Sub Menu 2" link="/menu-1/sub-menu-2" />
            </SidebarMenu>
            <SidebarMenu icon={warehouseIcon} description="Menu 2">
                <SidebarSubMenu description="Sub Menu 1" link="/menu-2/sub-menu-1" />
                <SidebarSubMenu description="Sub Menu 2" link="/menu-2/sub-menu-2" />
            </SidebarMenu>
            <SidebarMenu icon={warehouseIcon} description="Menu 3">
                <SidebarSubMenu description="Sub Menu 1" link="/menu-3/sub-menu-1" />
                <SidebarSubMenu description="Sub Menu 2" link="/menu-3/sub-menu-2" />
            </SidebarMenu>
        </Sidebar>
        <main className="layout-content">
            {children}
        </main>
    </div>
}

export default Layout
