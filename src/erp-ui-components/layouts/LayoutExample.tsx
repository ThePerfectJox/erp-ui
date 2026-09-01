import { Layout, SidebarGroup, SidebarList } from "./index";
import warehouseIcon from "../assets/warehouse.svg";

export default function LayoutExample() {
	const sidebarGroups = [
		<SidebarGroup
			key="inventory"
			description="Inventory"
			icon={warehouseIcon}
			list={[
				<SidebarList key="items" description="Items" />,
				<SidebarList key="stock" description="Stock levels" />,
				<SidebarList key="transfers" description="Transfers" />,
			]}
		/>,
		<SidebarGroup
			key="sales"
			description="Sales"
			icon={warehouseIcon}
			list={[
				<SidebarList key="orders" description="Orders" />,
				<SidebarList key="customers" description="Customers" />,
			]}
		/>,
	];

	return (
		<Layout
			sidebarGroups={sidebarGroups}
			content={<h1>Dashboard</h1>}
		/>
	);
}