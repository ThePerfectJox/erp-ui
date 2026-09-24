import { NavLink } from 'react-router-dom'

interface SidebarSubMenuProps {
    description: string
    link: string
}

function SidebarSubMenu({
    description,
    link
}: SidebarSubMenuProps) {
    return (
        <li className="sidebar-submenu-item">
            <NavLink to={link}>
                {description}
            </NavLink>
        </li>
    )
}

export default SidebarSubMenu