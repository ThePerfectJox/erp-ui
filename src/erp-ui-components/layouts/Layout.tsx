import { cloneElement, useState, type ReactElement, type ReactNode } from "react";
import Header from "./Header";
import SidebarHeader from "./SidebarHeader";
import Sidebar from "./Sidebar";
import Content from "./Content";
import Footer from "./Footer";

import "./index.css";

import sidebarOpenedIcon from "../assets/menu.svg";
import sidebarClosedIcon from "../assets/menu-close.svg";

interface LayoutProps {
	sidebarGroups: ReactElement<{ sidebarOpen?: boolean }>[],
	content: ReactNode,
}

export default function Layout({ sidebarGroups, content }: LayoutProps) {
	const [sidebarOpenState, setSidebarOpenState] = useState(true);
	const handleClick = () => {
		setSidebarOpenState((prevOpen) => !prevOpen);
	};

	const headerText = "ERP-UI"
	const footerText = `© ${new Date().getFullYear()} JoxNeis. All rights reserved`

	const groupsWithState = sidebarGroups.map((group, index) =>
		cloneElement(group, { key: group.key ?? index, sidebarOpen: sidebarOpenState })
	);

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
				sidebarGroups={groupsWithState}
				sidebarOpenState={sidebarOpenState}
			/>
			<Content
				component={content}
			/>
			<Footer text={footerText} />
		</>
	);
}
