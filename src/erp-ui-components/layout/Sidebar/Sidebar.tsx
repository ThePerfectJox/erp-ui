import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { classNames } from '../../shared/classNames'
/* The filenames read backwards against these names, and the names are the ones to
 * trust: they say what pressing the button *does*, not what the glyph looks like.
 * While the rail is open the button collapses it. */
import collapseIcon from '../../assets/menu.svg'
import expandIcon from '../../assets/menu-close.svg'
import { SidebarContext } from './SidebarContext'
import './Sidebar.css'

export interface SidebarProps {
	isOpen: boolean

	onOpenChange: (isOpen: boolean) => void

	/**
	 * The menu groups — `<SidebarMenu>` elements.
	 *
	 * `children` rather than a data prop, even though `Layout` builds them from data.
	 * The rail genuinely has no interest in what is in the groups: it provides the
	 * width, the open/closed state and the context, and the groups read what they
	 * need from that context rather than being handed it. Keeping the seam here means
	 * a caller who needs something the `SidebarGroup` model cannot express — a badge,
	 * a divider — can still use the rail.
	 */
	children?: ReactNode
}

/**
 * The navigation rail: 48px collapsed, a labelled menu when open.
 *
 * Controlled. It holds no state of its own — `Layout` owns whether it is open, and
 * each group owns whether it is expanded. That is why this file is short: its whole
 * job is turning two props into a class name and a context value.
 */
function Sidebar({ isOpen, onOpenChange, children }: SidebarProps) {
	const state = useMemo(() => ({ isOpen, requestOpen: () => onOpenChange(true) }), [isOpen, onOpenChange])

	/**
	 * While collapsed, pressing anywhere on the rail opens it — including the empty
	 * space below the menu.
	 *
	 * A pointer convenience, and deliberately redundant: the toggle button below is
	 * the keyboard and screen-reader path to the same thing, which is why this
	 * handler sits on a plain `<aside>` with no `role` and no `tabIndex`. Giving it
	 * either would announce the whole rail as a button and put a second, enormous
	 * tab stop in front of the real one.
	 */
	const handleRailClick = () => {
		if (!isOpen) {
			onOpenChange(true)
		}
	}

	return (
		<SidebarContext.Provider value={state}>
			<aside
				className={classNames('sidebar', isOpen ? 'sidebar-open' : 'sidebar-closed')}
				onClick={handleRailClick}
			>
				<div className="sidebar-header">
					{/* The only way to *close* the rail, and the only keyboard-reachable
					  * target in this file. */}
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

				{/* A list, because navigation is one — a screen reader announces how
				  * many groups there are before walking them. */}
				<ul className="sidebar-menu">{children}</ul>
			</aside>
		</SidebarContext.Provider>
	)
}

export default Sidebar
