import type { ReactNode } from "react";
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

/** A showcase heading — deliberately not FormSection: that one's flex-column body stretches its
 * children full-width, which suits form fields but not arbitrary demo content like a lone button. */
function ShowcaseSection({ id, title, children }: { id: string; title: string; children: ReactNode }) {
	return (
		<section id={id} style={{ marginBottom: "3rem" }}>
			<h2 style={{ margin: "0 0 1.25rem", paddingBottom: "0.75rem", borderBottom: "1px solid var(--color-border)" }}>
				{title}
			</h2>
			{children}
		</section>
	);
}

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

// One page, every module — composed inside a real Layout shell instead of
// floating loose, since that's how these components get used together.
export default function MasterExample() {
	return (
		<Layout
			sidebarGroups={sidebarGroups}
			content={
				<div>
					<h1 style={{ margin: "0 0 2rem" }}>Component showcase</h1>

					<ShowcaseSection id="showcase-modal" title="Modal">
						<ModalExample />
					</ShowcaseSection>

					<ShowcaseSection id="showcase-data-table" title="Data table">
						<DataTableExample />
					</ShowcaseSection>

					<ShowcaseSection id="showcase-forms" title="Forms">
						<FormExample />
					</ShowcaseSection>
				</div>
			}
		/>
	);
}
