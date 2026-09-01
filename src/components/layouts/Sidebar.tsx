import type { ReactElement } from "react";

interface SidebarProps {
	sidebarGroups: ReactElement[];
}

export default function Sidebar({ sidebarGroups }: SidebarProps) {
	return (
		<aside className="sidebar-group">
			{sidebarGroups}
		</aside>
	);
}
