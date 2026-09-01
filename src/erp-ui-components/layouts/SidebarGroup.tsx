import { useId, useState, type ReactElement } from "react";

interface SidebarGroupProps {
	id?: string,
	icon?: string,
	description: string,
	sidebarOpen: boolean,
	list: ReactElement[],
}

export default function SidebarGroup({ id, icon, description, sidebarOpen, list }: SidebarGroupProps) {
	const [sidebarGroupOpenState, setSidebarGroupOpenState] = useState(false);
	const uniqueId = useId();
	const finalId = id ?? uniqueId;

	const handleClick = () => {
		if (!sidebarOpen) {
			setSidebarGroupOpenState(false);
		}
		setSidebarGroupOpenState((prevOpen) => !prevOpen);
	};

	return (
		<div className="sidebar-group" id={finalId}>
			<div className="sidebar-group-header" onClick={handleClick} style={{ cursor: 'pointer' }}>
				{icon && (
					<img src={icon} alt="" className="sidebar-group-icon" />
				)}
				<span className="sidebar-group-description">{description}</span>
				<span className={sidebarGroupOpenState ? "sidebar-group-toggle" : "sidebar-group-toggle open"}>
					\u25B6
				</span>
			</div>
			{sidebarGroupOpenState ? (
				<div className="sidebar-group-list">
					{list.map((element, index) => (
						<div key={index} className="sidebar-group-list-item-wrapper">
							{element}
						</div>
					))}
				</div>
			) : <></>}
		</div>
	);
}
