import type { ReactElement } from "react";

interface SidebarProps {
	sidebarGroups: ReactElement[];
	setSidebarOpenState: () => void;
}

export default function Sidebar({ sidebarGroups, setSidebarOpenState }: SidebarProps) {
	return (
		<aside className="sidebar-group" onClick={setSidebarOpenState}>
			{sidebarGroups}
		</aside>
	);
}
