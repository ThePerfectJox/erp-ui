import { useId } from "react";

interface SidebarListProps {
	id?: string;
	icon?: string;
	description: string;
}

export default function SidebarList({ id, icon, description }: SidebarListProps) {
	const uniqueId = useId();
	const finalId = id ?? uniqueId;
	return (
		<div className="sidebar-list-item" id={finalId}>
			{icon && (
				<img src={icon} alt="" className="sidebar-list-item-icon" />
			)}
			<span className="sidebar-list-item-description">
				{description}
			</span>
		</div>
	);
}
