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
	const [isSaving, setIsSaving] = useState(false)

	const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		setIsSaving(true)
		window.setTimeout(() => setIsSaving(false), 1200)
	}

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
						<Button variant="negative" logo={<DeleteIcon />}>
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
		</div>
	)
}

export default PurchaseOrderScreen
