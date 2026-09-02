import type { CSSProperties } from "react";
import { Layout, SidebarGroup, SidebarList } from "./layouts";
import warehouseIcon from "./assets/warehouse.svg";
import ModalExample from "./modals/ModalExample";
import DataTableExample from "./data-table/DataTableExample";
import FormExample from "./forms/FormExample";

/** A sidebar row that jumps to a section below — plain anchor, no router needed for a single-page showcase. */
function NavLink({ href, description }: { href: string; description: string }) {
	return (
		<a href={href} style={{ display: "block", color: "inherit", textDecoration: "none" }}>
			<SidebarList description={description} />
		</a>
	);
}

/**
 * erp-ui-components/MasterExample.tsx
 *
 * One page, every module — mirrors the individual *Example.tsx demos, but
 * composed inside a real Layout shell instead of floating loose in <body>,
 * since that's how these components actually get used together in practice.
 * Not exported from any module's barrel; render it from App.tsx to see the
 * whole library at once.
 */
export default function MasterExample() {
	const sidebarGroups = [
		<SidebarGroup
			key="components"
			description="Components"
			icon={warehouseIcon}
			defaultExpanded
			list={[
				<NavLink key="modal" href="#showcase-modal" description="Modal" />,
				<NavLink key="data-table" href="#showcase-data-table" description="Data table" />,
				<NavLink key="forms" href="#showcase-forms" description="Forms" />,
			]}
		/>,
	];

	const sectionStyle: CSSProperties = { marginBottom: "3rem" };
	const headingStyle: CSSProperties = {
		margin: "0 0 1.25rem",
		paddingBottom: "0.75rem",
		borderBottom: "1px solid var(--color-border)",
		fontSize: "1.375rem",
	};

	return (
		<Layout
			sidebarGroups={sidebarGroups}
			content={
				<div>
					<h1 style={{ margin: "0 0 2rem" }}>Component showcase</h1>

					<section id="showcase-modal" style={sectionStyle}>
						<h2 style={headingStyle}>Modal</h2>
						<ModalExample />
					</section>

					<section id="showcase-data-table" style={sectionStyle}>
						<h2 style={headingStyle}>Data table</h2>
						<DataTableExample />
					</section>

					<section id="showcase-forms" style={sectionStyle}>
						<h2 style={headingStyle}>Forms</h2>
						<FormExample />
					</section>
				</div>
			}
		/>
	);
}
