import type { ReactElement } from "react";

interface SidebarProps {
	sidebarGroups: ReactElement[];
	sidebarOpenState: boolean;
}

export default function Sidebar({ sidebarGroups, sidebarOpenState }: SidebarProps) {
	return (
		<aside className={`sidebar ${sidebarOpenState ? "open" : "closed"}`}>
			{sidebarGroups}
		</aside>
	);
}
