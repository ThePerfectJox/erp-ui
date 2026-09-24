import Sidebar from './Sidebar/Sidebar'
import SidebarMenu from './Sidebar/SidebarMenu'
import SidebarSubMenu from './Sidebar/SidebarSubMenu'

function Layout() {
    return <div>
        <Sidebar isOpen={true}>
            <SidebarMenu icon="" description="Menu 1">
                <SidebarSubMenu description="Sub Menu 1" link="/sub-menu-1" />
                <SidebarSubMenu description="Sub Menu 2" link="/sub-menu-2" />
            </SidebarMenu>
            <SidebarMenu icon="" description="Menu 2">
                <SidebarSubMenu description="Sub Menu 1" link="/sub-menu-1" />
                <SidebarSubMenu description="Sub Menu 2" link="/sub-menu-2" />
            </SidebarMenu>
            <SidebarMenu icon="" description="Menu 3">
                <SidebarSubMenu description="Sub Menu 1" link="/sub-menu-1" />
                <SidebarSubMenu description="Sub Menu 2" link="/sub-menu-2" />
            </SidebarMenu>
        </Sidebar>
    </div>
}

export default Layout
