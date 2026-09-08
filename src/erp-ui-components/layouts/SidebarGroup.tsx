import { useId, useState, type ReactElement } from "react";

interface SidebarGroupProps {
	id?: string,
	icon?: string,
	description: string,
	sidebarOpen?: boolean,
	/** Supplied by `Layout` — lets a rail icon reopen the sidebar it lives in. */
	onRequestSidebarOpen?: () => void,
	defaultExpanded?: boolean,
	list: ReactElement[],
}

export default function SidebarGroup({ id, icon, description, sidebarOpen = true, onRequestSidebarOpen, defaultExpanded = false, list }: SidebarGroupProps) {
	const [sidebarGroupOpenState, setSidebarGroupOpenState] = useState(defaultExpanded);
	const uniqueId = useId();
	const finalId = id ?? uniqueId;

	const handleClick = () => {
		if (!sidebarOpen) {
			// Collapsed, this row is an icon-only shortcut into the group. Reopen
			// the sidebar *and* expand the group, so the one click the user has
			// room to make lands on the group's contents rather than just
			// widening the panel and leaving them to click again.
			onRequestSidebarOpen?.();
			setSidebarGroupOpenState(true);
			return;
		}
		setSidebarGroupOpenState((prevOpen) => !prevOpen);
	};

	return (
		<div className="sidebar-group" id={finalId}>
			{/* Collapsed, the description is display:none, so the row would other-
			  * wise be an unlabelled target — title gives the hover tooltip a rail
			  * needs, aria-label puts the name back in the accessibility tree.
			  * Both are dropped when open, where the visible label already says it. */}
			<div
				className="sidebar-group-header"
				onClick={handleClick}
				title={sidebarOpen ? undefined : description}
				aria-label={sidebarOpen ? undefined : description}
			>
				{icon ? (
					<img src={icon} alt="" className="sidebar-group-icon" />
				) : (
					// Only ever visible in the rail (see index.css) — an iconless
					// group still needs something to aim at once the label is gone.
					<span className="sidebar-group-initial" aria-hidden="true">{description.charAt(0)}</span>
				)}
				<span className="sidebar-group-description">{description}</span>
				<span className={sidebarGroupOpenState ? "sidebar-group-toggle open" : "sidebar-group-toggle"}>
					&#x25B6;
				</span>
			</div>
			{sidebarGroupOpenState && sidebarOpen ? (
				<div className="sidebar-group-list">
					{list.map((element, index) => (
						<div key={element.key ?? index} className="sidebar-group-list-item-wrapper">
							{element}
						</div>
					))}
				</div>
			) : <></>}
		</div>
	);
}
