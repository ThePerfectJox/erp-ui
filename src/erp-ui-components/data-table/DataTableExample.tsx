import { useState } from "react";
import { DataTable } from "./index";
import type { DataTableColumnDef } from "./dataTableUtils";

interface Product {
	id: string;
	sku: string;
	name: string;
	category: string;
	supplier: string;
	warehouse: string;
	price: number;
	quantity: number;
	inStock: boolean;
	lastUpdated: string;
}

const initialProducts: Product[] = [
	{ id: "p1", sku: "WDG-1001", name: "Widget", category: "Hardware", supplier: "Acme Industrial", warehouse: "Warehouse A - North Dock", price: 9.99, quantity: 420, inStock: true, lastUpdated: "2026-08-14" },
	{ id: "p2", sku: "GDG-2044", name: "Gadget", category: "Electronics", supplier: "Northwind Components", warehouse: "Warehouse B - South Bay", price: 19.5, quantity: 0, inStock: false, lastUpdated: "2026-07-29" },
	{ id: "p3", sku: "DHK-3310", name: "Doohickey", category: "Hardware", supplier: "Acme Industrial", warehouse: "Warehouse A - North Dock", price: 4.25, quantity: 1280, inStock: true, lastUpdated: "2026-08-02" },
	{ id: "p4", sku: "THG-4477", name: "Thingamajig", category: "Tooling", supplier: "Contoso Fabrication", warehouse: "Warehouse C - Central", price: 58.0, quantity: 76, inStock: true, lastUpdated: "2026-08-19" },
	{ id: "p5", sku: "SPR-5502", name: "Sprocket", category: "Hardware", supplier: "Fabrikam Metals", warehouse: "Warehouse B - South Bay", price: 3.1, quantity: 5400, inStock: true, lastUpdated: "2026-06-30" },
	{ id: "p6", sku: "GZM-6091", name: "Gizmo", category: "Electronics", supplier: "Northwind Components", warehouse: "Warehouse A - North Dock", price: 142.75, quantity: 12, inStock: true, lastUpdated: "2026-08-21" },
];

const columns: DataTableColumnDef<Product>[] = [
	{ key: "sku", label: "SKU" },
	{ key: "name", label: "Name", editable: true },
	{ key: "category", label: "Category", editable: true },
	{ key: "supplier", label: "Supplier" },
	{ key: "warehouse", label: "Warehouse" },
	{ key: "price", label: "Price", editable: true },
	{ key: "quantity", label: "Quantity", editable: true },
	{ key: "inStock", label: "In stock" },
	{ key: "lastUpdated", label: "Last updated" },
];

/** Built entirely outside <DataTable> — only knows what onSelectionChange reports. */
function DeleteSelectedButton({ selected, onDelete }: { selected: Product[]; onDelete: (ids: string[]) => void }) {
	if (selected.length === 0) return null;
	return (
		<button type="button" onClick={() => onDelete(selected.map((row) => row.id))}>
			Delete {selected.length} selected
		</button>
	);
}

/**
 * End-to-end example — mirrors ModalExample.tsx/LayoutExample.tsx. Not
 * exported from the barrel; render it from a route/screen to try the table
 * by hand.
 *
 * DataTable only renders/sorts/selects/edits `products`; DeleteSelectedButton
 * is a plain component built outside it, wired only through
 * `onSelectionChange` (in) and `actions` (out) — DataTable never knows the
 * button exists.
 *
 * The `maxWidth` wrapper is here on purpose, not on DataTable itself — sizing
 * is the caller's job (same rule as Modal's content). Nine columns of real
 * ERP-shaped data comfortably exceed it, so this is also the place to try the
 * table's horizontal scroll: the table scrolls sideways inside its own
 * container, the page scrolls normally if you resize the window shorter than
 * the row count — the two never fight each other.
 */
export default function DataTableExample() {
	const [products, setProducts] = useState(initialProducts);
	const [selected, setSelected] = useState<Product[]>([]);

	return (
		<div style={{ maxWidth: "700px" }}>
			<DataTable
				data={products}
				columns={columns}
				getRowId={(row) => row.id}
				onSelectionChange={(rows) => setSelected(rows)}
				actions={
					<DeleteSelectedButton
						selected={selected}
						onDelete={(ids) => setProducts((prev) => prev.filter((row) => !ids.includes(row.id)))}
					/>
				}
			/>
		</div>
	);
}
