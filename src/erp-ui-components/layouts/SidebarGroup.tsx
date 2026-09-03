import { useId, useState, type ReactElement } from "react";

interface SidebarGroupProps {
	id?: string,
	icon?: string,
	description: string,
	sidebarOpen?: boolean,
	defaultExpanded?: boolean,
	list: ReactElement[],
}

export default function SidebarGroup({ id, icon, description, sidebarOpen = true, defaultExpanded = false, list }: SidebarGroupProps) {
	const [sidebarGroupOpenState, setSidebarGroupOpenState] = useState(defaultExpanded);
	const uniqueId = useId();
	const finalId = id ?? uniqueId;

	const handleClick = () => {
		if (!sidebarOpen) return;
		setSidebarGroupOpenState((prevOpen) => !prevOpen);
	};

	return (
		<div className="sidebar-group" id={finalId}>
			<div className="sidebar-group-header" onClick={handleClick} style={{ cursor: 'pointer' }}>
				{icon && (
					<img src={icon} alt="" className="sidebar-group-icon" />
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
