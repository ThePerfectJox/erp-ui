interface SidebarHeaderProps {
	openedIcon?: string,
	closedIcon?: string,
	sidebarOpenState: boolean,
	setSidebarOpenState: () => void;
}

export default function SidebarHeader({ openedIcon, closedIcon, sidebarOpenState, setSidebarOpenState }: SidebarHeaderProps) {
	return (
		<div className="sidebar-header" onClick={setSidebarOpenState}>
			<img src={sidebarOpenState ? openedIcon : closedIcon} alt="" className="sidebar-header-icon" />
			<span className="sidebar-header-description">{"MENU"}</span>
		</div>
	);
}
