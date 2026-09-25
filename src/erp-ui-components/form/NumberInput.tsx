import FormControlShell from './FormControlShell'
import FormField from './FormField'
import { splitFieldProps, useFormField } from './useFormField'
import type { FieldAdornment, FieldBaseProps, PassthroughInputProps } from './FieldTypes'

interface NumberInputProps extends FieldBaseProps, PassthroughInputProps {
	/**
	 * Unit or currency shown inside the field after the value — `"EA"`, `"kg"`,
	 * `"%"`, `"EUR"`.
	 *
	 * It is decoration for assistive tech, so name the unit in the label as
	 * well: `label="Net weight (kg)"`. On a goods receipt the difference
	 * between kg and tonnes is not a detail anyone should have to infer.
	 */
	unit?: FieldAdornment

	/** Shown before the value, for currencies written on the left — `"$"`, `"£"`. */
	prefix?: FieldAdornment

	/**
	 * Left-aligns the digits. Off by default: numbers line up on their last
	 * digit when right-aligned, which is the only way a column of amounts can
	 * be compared at a glance, and it is what every ERP and every accountant
	 * expects. Turn it on for things that are not quantities — a document
	 * number, a year.
	 */
	isTextAligned?: boolean
}

/**
 * Numeric entry.
 *
 * ```tsx
 * <NumberInput
 *     label="Order quantity (EA)"
 *     unit="EA"
 *     min={1}
 *     step={1}
 *     value={quantity}
 *     onChange={event => setQuantity(event.target.value)}
 * />
 *
 * <NumberInput label="Net price (EUR)" prefix="€" step={0.01} unit="EUR" />
 * ```
 *
 * `inputMode="decimal"` is set for you, so a tablet shows a number pad rather
 * than the full keyboard. Override it with `inputMode="numeric"` for values
 * that cannot have a fractional part.
 *
 * Note that `event.target.value` is a **string**, as it is on any input — and
 * it is `""` for a number the browser considers incomplete, such as a lone
 * `"-"`. Keep it as a string in state and parse at the edge where you need a
 * number; parsing on every keystroke fights the user mid-type.
 */
function NumberInput({ unit, prefix, isTextAligned, ...props }: NumberInputProps) {
	const [field, nativeProps] = splitFieldProps(props)
	const { fieldProps, controlProps } = useFormField(field)

	const controlClassName = isTextAligned ? 'form-control' : 'form-control form-control-numeric'

	return (
		<FormField {...fieldProps}>
			<FormControlShell prefix={prefix} suffix={unit}>
				<input
					inputMode="decimal"
					{...nativeProps}
					{...controlProps}
					type="number"
					className={controlClassName}
				/>
			</FormControlShell>
		</FormField>
	)
}

export default NumberInput
