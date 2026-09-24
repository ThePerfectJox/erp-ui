import './SidebarMenu.css'

function SidebarMenu() {
    return <li className="sidebar-menu-item">
        <div>
            <span className="sidebar-menu-icon">
                {/* Icon */}
            </span>
            <span className="sidebar-menu-description">
                {/* Description */}
            </span>
        </div>
        <ul className="sidebar-submenu">
        </ul>
    </li>
}

export default SidebarMenu
