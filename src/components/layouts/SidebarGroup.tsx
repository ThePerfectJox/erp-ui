import { useId, type ReactElement } from "react";

interface SidebarGroupProps {
	id?: string;
	icon?: string;
	description: string;
	list: ReactElement[];
}

export default function SidebarGroup({ id, icon, description, list }: SidebarGroupProps) {
	const uniqueId = useId();
	const finalId = id ?? uniqueId;

	return (
		<div className="sidebar-group" id={finalId}>
			<div className="sidebar-group-header">
				{icon && (
					<img src={icon} alt="" className="sidebar-group-icon" />
				)}
				<span className="sidebar-group-description">{description}</span>
			</div>

			<div className="sidebar-group-list">
				{list.map((element, index) => (
					<div key={index} className="sidebar-group-list-item-wrapper">
						{element}
					</div>
				))}
			</div>
		</div>
	);
}
