import { useState, type ReactElement, type ReactNode } from "react";
import Header from "./Header";
import SidebarHeader from "./SidebarHeader";
import Sidebar from "./Sidebar";
import Content from "./Content";
import Footer from "./Footer";

interface LayoutProps {
	sidebarGroups: ReactElement[],
	content: ReactNode,
}

export default function Layout({ sidebarGroups, content }: LayoutProps) {
	const [sidebarOpenState, setSidebarOpenState] = useState(true);
	const handleClick = () => {
		setSidebarOpenState((prevOpen) => !prevOpen);
	};

	const sidebarOpenedIcon = "../assets/menu.svg"
	const sidebarClosedIcon = "../assets/menu-close.svg"
	const headerText = "ERP-UI"
	const footerText = `&copy; ${new Date().getFullYear()} JoxNeis. All rights reserved`

	return (
		<>
			<Header
				leftSide={
					<SidebarHeader
						openedIcon={sidebarOpenedIcon}
						closedIcon={sidebarClosedIcon}
						sidebarOpenState={sidebarOpenState}
						setSidebarOpenState={handleClick}
					/>
				}
				text={headerText}
			/>
			<Sidebar
				sidebarGroups={sidebarGroups}
				setSidebarOpenState={handleClick}
			/>
			<Content
				component={content}
			/>
			<Footer text={footerText} />
		</>
	);
}