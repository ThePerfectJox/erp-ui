interface SidebarMenuProps {
    icon: string
    description: string
    children?: React.ReactNode
}

function SidebarMenu({ icon, description, children }: SidebarMenuProps) {
    return <li className="sidebar-menu-item">
        <div>
            <span className="sidebar-menu-icon">
                <img src={icon} alt=""></img>
            </span>
            <span className="sidebar-menu-description">
                {description}
            </span>
        </div>
        <ul className="sidebar-submenu">
            {children}
        </ul>
    </li>
}

export default SidebarMenu
