import { useState } from 'react'
import type { FormEvent } from 'react'
import downloadIcon from './erp-ui-components/assets/download.svg'
import {
	Button,
	Checkbox,
	CheckboxGroup,
	ComboBox,
	DateInput,
	FileInput,
	Form,
	FormActions,
	FormRow,
	FormSection,
	MessageStrip,
	NumberInput,
	RadioGroup,
	Select,
	Switch,
	TextArea,
	TextInput,
} from './erp-ui-components/form'
import { BarChart, DonutChart, LineChart } from './erp-ui-components/chart'
import type { ChartSlice } from './erp-ui-components/chart'
import { Modal } from './erp-ui-components/overlay'
import { DataGrid } from './erp-ui-components/sheet'
import type { GridColumn, GridRow, RowChangeKind } from './erp-ui-components/sheet'
import './PurchaseOrderScreen.css'

/* Inline icons, for the buttons whose logo has to follow the button's own text
 * colour — white on a filled blue or red button. An imported .svg comes through
 * as an <img>, which paints its own fill and would stay black there; a node
 * inherits currentColor. Both routes are shown below. */
function SaveIcon() {
	return (
		<svg viewBox="0 -960 960 960" aria-hidden="true">
			<path d="M840-680v480q0 33-23.5 56.5T760-120H200q-33 0-56.5-23.5T120-200v-560q0-33 23.5-56.5T200-840h480l160 160Zm-80 34L646-760H200v560h560v-446ZM480-240q50 0 85-35t35-85q0-50-35-85t-85-35q-50 0-85 35t-35 85q0 50 35 85t85 35ZM240-560h360v-160H240v160Z" />
		</svg>
	)
}

function DeleteIcon() {
	return (
		<svg viewBox="0 -960 960 960" aria-hidden="true">
			<path d="M280-120q-33 0-56.5-23.5T200-200v-520h-40v-80h200v-40h240v40h200v80h-40v520q0 33-23.5 56.5T680-120H280Zm400-600H280v520h400v-520ZM360-280h80v-360h-80v360Zm160 0h80v-360h-80v360Z" />
		</svg>
	)
}

function FilterIcon() {
	return (
		<svg viewBox="0 -960 960 960" aria-hidden="true">
			<path d="M400-240v-80h160v80H400ZM240-440v-80h480v80H240ZM120-640v-80h720v80H120Z" />
		</svg>
	)
}

const PLANTS = [
	{ value: '1000', label: '1000 — Hamburg' },
	{ value: '2000', label: '2000 — Rotterdam' },
	{ value: '3000', label: '3000 — Singapore' },
	{ value: '4000', label: '4000 — São Paulo (inactive)', isDisabled: true },
]

const CURRENCIES = [
	{ value: 'EUR', label: 'EUR — Euro' },
	{ value: 'USD', label: 'USD — US Dollar' },
	{ value: 'SGD', label: 'SGD — Singapore Dollar' },
]

/* Long enough that scrolling a native <select> stops being reasonable, which is
 * the case ComboBox exists for. */
const MATERIALS = [
	{ value: 'R-1104', label: 'R-1104 — Steel sheet 2mm', description: 'Raw material · 1,240 EA on hand' },
	{ value: 'R-1105', label: 'R-1105 — Steel sheet 3mm', description: 'Raw material · 80 EA on hand' },
	{ value: 'R-1106', label: 'R-1106 — Steel sheet 4mm', description: 'Raw material · none on hand' },
	{ value: 'R-2201', label: 'R-2201 — Aluminium coil 0.8mm', description: 'Raw material · 415 KG on hand' },
	{ value: 'R-2202', label: 'R-2202 — Aluminium coil 1.2mm', description: 'Raw material · 38 KG on hand' },
	{ value: 'H-4010', label: 'H-4010 — Hex bolt M8×40', description: 'Hardware · 12,900 EA on hand' },
	{ value: 'H-4011', label: 'H-4011 — Hex bolt M10×50', description: 'Hardware · 8,410 EA on hand' },
	{ value: 'H-4012', label: 'H-4012 — Washer M8', description: 'Hardware · 44,000 EA on hand' },
	{ value: 'P-8800', label: 'P-8800 — Powder coat, signal white', description: 'Consumable · 96 L on hand' },
	{ value: 'P-8801', label: 'P-8801 — Powder coat, graphite grey', description: 'Consumable · 12 L on hand' },
	{ value: 'P-8802', label: 'P-8802 — Powder coat, deep blue', description: 'Blocked for procurement', isDisabled: true },
	{ value: 'C-0450', label: 'C-0450 — Cardboard sleeve 400×300', description: 'Packaging · 2,600 EA on hand' },
	{ value: 'C-0451', label: 'C-0451 — Pallet, Euro', description: 'Packaging · 310 EA on hand' },
	{ value: 'S-9001', label: 'S-9001 — Freight, road, EU domestic', description: 'Service · no stock' },
	{ value: 'S-9002', label: 'S-9002 — Freight, sea, FCL', description: 'Service · no stock' },
]

const COST_CENTRES = [
	{ value: '4210', label: '4210 — Production Hamburg' },
	{ value: '4220', label: '4220 — Production Rotterdam' },
	{ value: '4310', label: '4310 — Maintenance' },
	{ value: '4410', label: '4410 — Quality assurance' },
	{ value: '5100', label: '5100 — Inbound logistics' },
	{ value: '5200', label: '5200 — Outbound logistics' },
	{ value: '6100', label: '6100 — Research and development' },
	{ value: '7100', label: '7100 — Sales, Northern Europe' },
	{ value: '7200', label: '7200 — Sales, APAC' },
	{ value: '9000', label: '9000 — Administration' },
]

/**
 * An item's net value.
 *
 * Defined once and used by the grid's derived column, the charts and the modal, so
 * the three cannot disagree about what a line is worth — which is the kind of
 * discrepancy that gets blamed on the database.
 */
function netValueOf(row: GridRow): number {
	const quantity = typeof row.quantity === 'number' ? row.quantity : 0
	const price = typeof row.price === 'number' ? row.price : 0

	return quantity * price
}

/**
 * Running totals: `[a, a + b, a + b + c, …]`.
 *
 * A module-level function rather than an accumulator variable inside the component.
 * Threading a `let` through a `map` callback during render is what
 * `react-hooks/immutability` exists to catch — under the React compiler that
 * variable can survive into the next render and quietly double the totals.
 */
function runningTotals(values: readonly number[]): number[] {
	return values.reduce<number[]>((totals, value) => {
		totals.push((totals.length > 0 ? totals[totals.length - 1] : 0) + value)

		return totals
	}, [])
}

/** Material number prefix to the group it belongs to, for the donut. */
const MATERIAL_GROUPS: Record<string, string> = {
	R: 'Raw material',
	H: 'Hardware',
	P: 'Consumable',
	C: 'Packaging',
	S: 'Service',
}

function materialGroupOf(row: GridRow): string {
	const material = typeof row.material === 'string' ? row.material : ''

	return MATERIAL_GROUPS[material.charAt(0)] ?? 'Other'
}

const EURO = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'EUR' })

const ITEM_COLUMNS: GridColumn[] = [
	/* Item number is the document's own sequence, so sorting by it is how you get
	 * back to document order after sorting by something else. */
	{ key: 'item', header: 'Item', width: 70, type: 'number', isReadOnly: true },
	{ key: 'material', header: 'Material', width: 110 },
	/* Widest, because it holds the longest text. Every column in the grid has a
	 * definite width — they add up to how wide the table is, and the grid scrolls
	 * sideways rather than squeezing them to fit the card. */
	{ key: 'description', header: 'Description', width: 260 },
	{ key: 'quantity', header: 'Quantity', width: 100, type: 'number' },
	{ key: 'unit', header: 'Unit', width: 70 },
	{
		key: 'price',
		header: 'Net price',
		width: 110,
		type: 'number',
		/* Two decimals in the grid and on the clipboard, and parsed back off it.
		 * A format with no matching parse is how a column becomes unpasteable. */
		format: value => (typeof value === 'number' ? value.toFixed(2) : ''),
	},
	{
		key: 'total',
		header: 'Net value',
		width: 120,
		type: 'number',
		/* Derived, so it is read-only — and computed here rather than stored, so it
		 * cannot drift out of step with the quantity and price. */
		isReadOnly: true,
		format: (_unused, row) => netValueOf(row).toFixed(2),
		/* Nothing is stored under `total`, so without this the sort would read
		 * undefined from every row and do nothing. The real number, not the
		 * formatted string — otherwise "100" would sort before "20". */
		sortValue: netValueOf,
	},
]

const INITIAL_ITEMS: GridRow[] = [
	{ item: 10, material: 'R-1104', description: 'Steel sheet 2mm', quantity: 120, unit: 'EA', price: 18.4 },
	{ item: 20, material: 'H-4010', description: 'Hex bolt M8×40', quantity: 2400, unit: 'EA', price: 0.14 },
	{ item: 30, material: 'H-4012', description: 'Washer M8', quantity: 2400, unit: 'EA', price: 0.03 },
	{ item: 40, material: 'P-8800', description: 'Powder coat, signal white', quantity: 24, unit: 'L', price: 31.5 },
	{ item: 50, material: 'C-0451', description: 'Pallet, Euro', quantity: 18, unit: 'EA', price: 12.75 },
	{ item: 60, material: 'R-2201', description: 'Aluminium coil 0.8mm', quantity: 400, unit: 'KG', price: 4.62 },
]

const PRIORITIES = [
	{ value: 'standard', label: 'Standard', description: 'Ships within 5 working days.' },
	{ value: 'express', label: 'Express', description: 'Next working day. Surcharge applies.' },
	{ value: 'pickup', label: 'Customer pickup' },
]

const OUTPUT_TYPES = [
	{ value: 'order', label: 'Purchase order' },
	{ value: 'confirmation', label: 'Order confirmation' },
	{ value: 'label', label: 'Shipping labels' },
]

/**
 * A representative ERP maintenance screen, here to exercise every control in
 * the form folder at once — which makes it the fastest way to see whether a
 * change to the tokens or to Form.css has broken something.
 *
 * It is a demo, not part of the component library: it lives in src/ rather than
 * in erp-ui-components/.
 */
function PurchaseOrderScreen() {
	const [supplier, setSupplier] = useState('Nordwind Handel GmbH')
	const [email, setEmail] = useState('bestellung@')
	const [plant, setPlant] = useState('1000')
	const [material, setMaterial] = useState('R-1104')
	const [costCentre, setCostCentre] = useState('')
	const [currency, setCurrency] = useState('EUR')
	const [quantity, setQuantity] = useState('120')
	const [price, setPrice] = useState('18.40')
	const [deliveryDate, setDeliveryDate] = useState('2026-10-15')
	const [priority, setPriority] = useState('express')
	const [outputs, setOutputs] = useState<string[]>(['order'])
	const [note, setNote] = useState('')
	const [isCompleted, setIsCompleted] = useState(false)
	const [isAutoPosting, setIsAutoPosting] = useState(true)
	const [items, setItems] = useState(INITIAL_ITEMS)

	/* Controlled, so the save flow can clear the marks — and only once the server
	 * has actually accepted them. */
	const [dirtyItems, setDirtyItems] = useState<Map<string, RowChangeKind>>(new Map())

	const [isSaving, setIsSaving] = useState(false)

	/* The modal is controlled from here, which is the point of `isOpen`/`onClose`:
	 * the dialog asks to close and this screen decides. */
	const [isDeleteOpen, setIsDeleteOpen] = useState(false)

	/* --- chart data, all derived from the grid's own rows -------------------
	 * Nothing here is a separate copy of the data, so editing a quantity in the
	 * grid moves the bars, the line and the donut on the same keystroke. That is
	 * the case worth demonstrating — a dashboard fed from a second source is a
	 * dashboard that eventually disagrees with the document it describes. */

	const itemLabels = items.map(row => (typeof row.material === 'string' ? row.material : '—'))
	const netValues = items.map(netValueOf)

	/* A running total down the item list: how the order's value builds up, and which
	 * line takes it past whatever the approval threshold is. */
	const cumulativeValues = runningTotals(netValues)

	const valueByGroup = items.reduce<Map<string, number>>((totals, row) => {
		const group = materialGroupOf(row)

		totals.set(group, (totals.get(group) ?? 0) + netValueOf(row))

		return totals
	}, new Map())

	const groupSlices: ChartSlice[] = [...valueByGroup]
		/* Largest first. Comparing two similar arcs is hard enough without them
		 * sitting on opposite sides of the circle. */
		.sort(([, left], [, right]) => right - left)
		.map(([group, value]) => ({ key: group, label: group, value }))

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setIsSaving(true)

		/* What a real save would send. The grid has already split the work into
		 * inserts and updates, so this is the whole of the decision:
		 *
		 *   const added   = [...dirtyItems].filter(([, kind]) => kind === 'added')
		 *   const edited  = [...dirtyItems].filter(([, kind]) => kind === 'edited')
		 *   await Promise.all([postItems(added), patchItems(edited)])
		 */
		window.setTimeout(() => {
			setIsSaving(false)

			/* Cleared only after the request resolved. Clearing on edit would show
			 * "saved" for rows still sitting in a failed request. */
			setDirtyItems(new Map())
		}, 1200)
	}

	const changedCount = dirtyItems.size

	return (
		<div className="po-screen">
			<header className="po-header">
				<p className="po-eyebrow">Purchasing</p>
				<h1 className="po-title">Purchase order 4500001827</h1>
				<p className="po-subtitle">Created 21.09.2026 by M. Berger · Not yet released</p>
			</header>

			<div className="po-card">
				{/* Not live: this strip is part of the screen on load, and an
				  * alert firing during page load interrupts whatever the screen
				  * reader was reading. */}
				<MessageStrip valueState="information">
					Prices are taken from contract 4600000912 and cannot be changed on the item.
				</MessageStrip>

				{/* noValidate because the screen reports its own valueState —
				  * without it the browser would show a second, differently
				  * styled message for the same problem. */}
				<Form labelPlacement="beside" onSubmit={handleSubmit} noValidate>
					<FormSection title="Header" description="Applies to every item on this order.">
						<FormRow>
							<TextInput
								label="Supplier"
								name="supplier"
								value={supplier}
								onChange={event => setSupplier(event.target.value)}
								isRequired
							/>
							<TextInput label="Purchase order" name="documentNumber" value="4500001827" isReadOnly />
						</FormRow>

						<FormRow>
							<TextInput
								label="Contact email"
								name="email"
								type="email"
								value={email}
								onChange={event => setEmail(event.target.value)}
								valueState="error"
								valueStateMessage="Enter a complete address, for example name@company.com"
							/>
							<TextInput
								label="Your reference"
								name="reference"
								placeholder="Optional"
								hint="Printed on the order confirmation."
							/>
						</FormRow>

						<FormRow>
							<Select
								label="Plant"
								name="plant"
								placeholder="Select a plant"
								options={PLANTS}
								value={plant}
								onChange={event => setPlant(event.target.value)}
								isRequired
							/>
							<DateInput
								label="Delivery date"
								name="deliveryDate"
								value={deliveryDate}
								onChange={event => setDeliveryDate(event.target.value)}
								valueState="warning"
								valueStateMessage="Earlier than the agreed lead time of 14 days."
								isRequired
							/>
						</FormRow>
					</FormSection>

					<FormSection title="Item 00010" description="Raw material R-1104 — Steel sheet 2mm">
						<FormRow>
							{/* Fifteen options with codes people know by heart —
							  * the case a native <select> handles badly. */}
							<ComboBox
								label="Material"
								name="material"
								placeholder="Search by number or description"
								options={MATERIALS}
								value={material}
								onChange={setMaterial}
								hint="Type a material number or part of its description."
								isRequired
							/>
							<ComboBox
								label="Cost centre"
								name="costCentre"
								placeholder="Search cost centres"
								options={COST_CENTRES}
								value={costCentre}
								onChange={setCostCentre}
								isClearable
							/>
						</FormRow>

						<FormRow columns={3}>
							<NumberInput
								label="Order quantity (EA)"
								name="quantity"
								unit="EA"
								min={1}
								step={1}
								value={quantity}
								onChange={event => setQuantity(event.target.value)}
								isRequired
							/>
							<NumberInput
								label="Net price (EUR)"
								name="price"
								prefix="€"
								step={0.01}
								value={price}
								onChange={event => setPrice(event.target.value)}
								valueState="success"
								valueStateMessage="Matches contract 4600000912."
							/>
							<Select
								label="Currency"
								name="currency"
								options={CURRENCIES}
								value={currency}
								onChange={event => setCurrency(event.target.value)}
							/>
						</FormRow>

						<FormRow columns={3}>
							<NumberInput label="Net value (EUR)" value="2208.00" unit="EUR" isReadOnly />
							{/* defaultValue, not value: React warns about a `value`
							  * with no `onChange` unless `readOnly` is also set,
							  * and this field is disabled rather than read-only. */}
							<NumberInput label="Tax rate (%)" unit="%" defaultValue="19" isDisabled />
							<NumberInput label="Document year" value="2026" isTextAligned isReadOnly />
						</FormRow>
					</FormSection>

					<FormSection
						title="Items"
						description="Click a heading to sort. Drag a column or row edge to resize, double-click it to reset — widen past the card and the grid scrolls. Hold shift, or press and hold, to select a range. Copy it straight into Excel, or paste a block back in."
					>
						{changedCount > 0 && (
							<MessageStrip valueState="warning" isLive>
								{changedCount === 1 ? '1 item has' : `${changedCount} items have`} unsaved changes.
								Marked in the row numbers.
							</MessageStrip>
						)}

						<DataGrid
							caption="Purchase order items"
							isCaptionHidden
							columns={ITEM_COLUMNS}
							rows={items}
							onChange={setItems}
							/* The document's own item number, so a mark stays with
							 * its row through sorting rather than following a
							 * position. */
							getRowId={row => String(row.item)}
							dirtyRows={dirtyItems}
							onDirtyRowsChange={setDirtyItems}
							canGrowOnPaste
							maxBodyHeight="15rem"
						/>
					</FormSection>

					<FormSection
						title="Analysis"
						description="Read straight off the item table above — edit a quantity and all three move."
					>
						{/* One series, so no legend: a key explaining a single colour is
						  * furniture. The caption already says what the bars are. */}
						<BarChart
							caption="Net value by item"
							categories={itemLabels}
							series={[{ key: 'net', label: 'Net value', values: netValues }]}
							legendPlacement="none"
							height={200}
							formatValue={value => EURO.format(value)}
							categoryHeader="Material"
						/>

						<div className="po-chart-pair">
							{/* An area, and only one series — two filled areas would hide
							  * one another. A running total is exactly the shape an area
							  * suits: the fill is the value accumulated so far. */}
							<LineChart
								caption="Cumulative net value"
								categories={itemLabels}
								series={[{ key: 'cumulative', label: 'Running total', values: cumulativeValues }]}
								isArea
								hasMarkers
								legendPlacement="none"
								height={200}
								formatValue={value => EURO.format(value)}
								categoryHeader="Material"
							/>

							{/* Four or five groups, which is what a donut is for. The legend
							  * beside it carries each group's value and share, since neither
							  * can be read off an arc. */}
							<DonutChart
								caption="Share by material group"
								slices={groupSlices}
								totalLabel="Net total"
								height={200}
								formatValue={value => EURO.format(value)}
								categoryHeader="Material group"
							/>
						</div>
					</FormSection>

					<FormSection title="Shipping and output">
						<RadioGroup
							label="Delivery priority"
							name="priority"
							options={PRIORITIES}
							value={priority}
							onChange={setPriority}
							isRequired
						/>

						<CheckboxGroup
							label="Print on release"
							name="outputs"
							options={OUTPUT_TYPES}
							value={outputs}
							onChange={setOutputs}
							orientation="horizontal"
							hint="Sent to the supplier's registered address."
						/>

						<Switch
							label="Automatic goods receipt posting"
							name="autoPosting"
							checked={isAutoPosting}
							onChange={event => setIsAutoPosting(event.target.checked)}
							hint="Posts the receipt as soon as the carrier confirms delivery."
						/>

						<Checkbox
							label="Delivery completed"
							name="completed"
							checked={isCompleted}
							onChange={event => setIsCompleted(event.target.checked)}
						/>
					</FormSection>

					<FormSection title="Attachments and notes">
						<FileInput
							label="Supplier quotation"
							name="quotation"
							accept="application/pdf,image/*"
							hint="PDF or image, up to 10 MB."
							multiple
						/>

						<TextArea
							label="Header note"
							name="note"
							rows={4}
							maxLength={500}
							hasCounter
							value={note}
							onChange={event => setNote(event.target.value)}
							placeholder="Visible to the supplier on the printed order."
						/>
					</FormSection>

					<FormActions>
						{/* Logo as an imported .svg URL: an <img>, so it keeps its
						  * own black fill — right on a white button. */}
						<Button logo={downloadIcon}>Export</Button>

						{/* Logo as a node, so it inherits the button's white text
						  * colour. An <img> could not. */}
						<Button variant="negative" logo={<DeleteIcon />} onClick={() => setIsDeleteOpen(true)}>
							Delete
						</Button>

						{/* No children, so aria-label is required — the union type
						  * on ButtonProps will not compile without it. */}
						<Button variant="transparent" logo={<FilterIcon />} aria-label="Filter items" />

						<Button variant="transparent">Cancel</Button>

						<Button variant="emphasized" type="submit" logo={<SaveIcon />} isLoading={isSaving}>
							{isSaving ? 'Saving' : 'Save'}
						</Button>
					</FormActions>
				</Form>
			</div>

			{/* Outside the <Form> on purpose. A dialog renders in the browser's top
			  * layer so it makes no visual difference, but nesting a form's worth of
			  * controls inside another form's element tree is the sort of thing that
			  * ends with Enter submitting the wrong one.
			  *
			  * The children here are the point: a message strip and a whole DataGrid,
			  * which the modal knows nothing about. It owns the frame, the header, the
			  * footer and the behaviour, and has no opinion on what goes between them. */}
			<Modal
				isOpen={isDeleteOpen}
				onClose={() => setIsDeleteOpen(false)}
				title="Delete purchase order 4500001827?"
				description={`All ${items.length} items are removed. This cannot be undone.`}
				size="large"
				footer={
					<>
						<Button variant="transparent" onClick={() => setIsDeleteOpen(false)}>
							Cancel
						</Button>

						{/* Not autofocused. A dialog that deletes on one press of Enter is
						  * a data-loss bug with a confirmation step bolted on. */}
						<Button variant="negative" logo={<DeleteIcon />} onClick={() => setIsDeleteOpen(false)}>
							Delete order
						</Button>
					</>
				}
			>
				<MessageStrip valueState="warning">
					Goods receipts already posted against this order stay in place and will need to be
					reversed separately.
				</MessageStrip>

				<DataGrid
					caption="Items to be deleted"
					columns={ITEM_COLUMNS}
					rows={items}
					getRowId={row => String(row.item)}
					isReadOnly
					maxBodyHeight="12rem"
				/>

				<p className="po-modal-total">
					Net total <strong>{EURO.format(netValues.reduce((total, value) => total + value, 0))}</strong>
				</p>
			</Modal>
		</div>
	)
}

export default PurchaseOrderScreen
