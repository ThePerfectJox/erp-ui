import { useState } from 'react'
import type { ReactNode } from 'react'
import { classNames } from '../../shared/classNames'
import { useSidebar } from './SidebarContext'

export interface SidebarMenuProps {
	/** Icon URL — what importing an `.svg` resolves to. Decorative. */
	icon: string

	/** The group name. Shown beside the icon, and the tooltip while collapsed. */
	label: string

	/** The links — `<SidebarSubMenu>` elements. */
	children?: ReactNode
}

/**
 * One expandable group: the header row that opens it, and the links underneath.
 *
 * This is where the only real logic in the layout folder lives, and it is all one
 * idea: **a collapsed rail has nowhere to put a submenu.**
 */
function SidebarMenu({ icon, label, children }: SidebarMenuProps) {
	const { isOpen: isSidebarOpen, requestOpen } = useSidebar()
	const [isExpanded, setIsExpanded] = useState(false)

	/* Expanded only counts while the rail is open. Collapsing both facts into one
	 * derived flag means the stylesheet never has to un-do an expanded group in the
	 * collapsed state, and `aria-expanded` cannot claim a submenu is showing when
	 * there is no room for one. */
	const isGroupExpanded = isSidebarOpen && isExpanded

	const handleClick = () => {
		if (!isSidebarOpen) {
			/* Collapsed: this click is also opening the rail, so drop the group open
			 * rather than toggling something nobody can see. Two clicks to reach a link
			 * from a closed rail, not three. */
			requestOpen()
			setIsExpanded(true)
			return
		}

		setIsExpanded(!isExpanded)
	}

	return (
		<li className={classNames('sidebar-group', isGroupExpanded && 'sidebar-group-expanded')}>
			<button
				type="button"
				className="sidebar-group-header"
				onClick={handleClick}
				aria-expanded={isGroupExpanded}
				/* Carries the label while the rail is collapsed and the text is hidden.
				 * The label is still in the DOM — CSS hides it — so this is a
				 * convenience for the pointer, not the accessible name. */
				title={label}
			>
				<span className="sidebar-group-icon">
					<img src={icon} alt="" />
				</span>

				<span className="sidebar-group-label">{label}</span>

				<span className="sidebar-group-chevron" aria-hidden="true" />
			</button>

			{/* Always rendered, hidden by CSS when collapsed. Unmounting it instead
			  * would lose the expand transition and make the group's height jump. */}
			<ul className="sidebar-submenu">{children}</ul>
		</li>
	)
}

export default SidebarMenu
