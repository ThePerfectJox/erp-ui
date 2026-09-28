import warehouseIcon from './erp-ui-components/assets/warehouse.svg'
import { Layout } from './erp-ui-components/layout'
import type { SidebarGroup } from './erp-ui-components/layout'
import PurchaseOrderScreen from './PurchaseOrderScreen'

/**
 * The application's navigation.
 *
 * It lives here, in the app, rather than inside `Layout` — which is where it used to
 * be, spelled out as literal JSX. A layout component that ships a hard-coded menu is
 * not a layout component, it is this screen wearing one, and copying the library
 * folder into another project brought "Menu 1" along with it.
 *
 * The same icon three times is a placeholder; the point of the shape is that swapping
 * in real icons and real routes is an edit to this file only.
 */
const MENU: SidebarGroup[] = [
	{
		label: 'Purchasing',
		icon: warehouseIcon,
		links: [
			{ label: 'Purchase orders', to: '/purchasing/orders' },
			{ label: 'Requisitions', to: '/purchasing/requisitions' },
		],
	},
	{
		label: 'Inventory',
		icon: warehouseIcon,
		links: [
			{ label: 'Stock overview', to: '/inventory/stock' },
			{ label: 'Goods receipts', to: '/inventory/receipts' },
		],
	},
	{
		label: 'Master data',
		icon: warehouseIcon,
		links: [
			{ label: 'Materials', to: '/master-data/materials' },
			{ label: 'Suppliers', to: '/master-data/suppliers' },
		],
	},
]

/**
 * There is deliberately no route table here.
 *
 * `PurchaseOrderScreen` renders whatever the URL is, so the sidebar links move the
 * selected marker and change the address without changing the content. That is
 * honest for a component demo — adding six placeholder screens would be more code
 * and less to look at.
 */
function App() {
	return (
		<Layout menu={MENU}>
			<PurchaseOrderScreen />
		</Layout>
	)
}

export default App
