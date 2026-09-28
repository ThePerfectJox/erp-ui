import type { ChangeEvent } from 'react'
import { splitFieldProps } from '../core/fieldProps'
import type { ChoiceOrientation, FieldBaseProps, FieldOption } from '../core/types'
import { useFormField } from '../hooks/useFormField'
import ChoiceList from '../parts/ChoiceList'
import FormField from '../parts/FormField'

interface CheckboxGroupProps extends FieldBaseProps {
	/** The choices. */
	options: readonly FieldOption[]

	/**
	 * The values currently ticked. Controlled: pass it together with `onChange`
	 * and keep the array in your own state.
	 */
	value?: readonly string[]

	/** Initial ticks when uncontrolled. */
	defaultValue?: readonly string[]

	/**
	 * The full set of ticked values after the change, not the one that moved.
	 * Building that array is the same three lines in every caller, so it is
	 * done here once:
	 *
	 * ```tsx
	 * onChange={setSelectedPlants}
	 * ```
	 *
	 * Order follows `options`, not the order the user clicked, so the array is
	 * stable and comparable between renders.
	 */
	onChange?: (values: string[], event: ChangeEvent<HTMLInputElement>) => void

	/** Defaults to `"vertical"`. */
	orientation?: ChoiceOrientation
}

/**
 * Any number of choices out of several, under one caption.
 *
 * ```tsx
 * <CheckboxGroup
 *     label="Include document types"
 *     name="documentTypes"
 *     options={[
 *         { value: 'invoice', label: 'Invoices' },
 *         { value: 'credit', label: 'Credit memos' },
 *         { value: 'delivery', label: 'Delivery notes' },
 *     ]}
 *     value={documentTypes}
 *     onChange={setDocumentTypes}
 * />
 * ```
 *
 * Controlled only in practice: an uncontrolled group can render from
 * `defaultValue` but cannot report changes as a set, because each box only
 * knows about itself. If you want the values, pass `value` and `onChange`.
 *
 * `isRequired` marks the group with `aria-required` but deliberately does not
 * put `required` on the boxes. On a checkbox that attribute means *this* box
 * must be ticked, which is not what "pick at least one" means — the browser
 * would refuse to submit until every box was on. Enforce the real rule in your
 * own validation and report it through `valueState`.
 */
function CheckboxGroup({
	options,
	value,
	defaultValue,
	onChange,
	orientation = 'vertical',
	...props
}: CheckboxGroupProps) {
	const [field] = splitFieldProps(props)
	const { fieldProps, groupProps, controlId } = useFormField(field)

	const handleOptionChange = (option: FieldOption, event: ChangeEvent<HTMLInputElement>) => {
		if (!onChange) {
			return
		}

		const selected = new Set(value ?? [])

		if (event.target.checked) {
			selected.add(option.value)
		} else {
			selected.delete(option.value)
		}

		/* Rebuilt by filtering `options` rather than by pushing onto or splicing the
		 * previous array. That keeps the result in the order the options are
		 * declared however the user clicked, and it cannot produce a duplicate. */
		onChange(
			options.map(candidate => candidate.value).filter(candidate => selected.has(candidate)),
			event
		)
	}

	return (
		<FormField {...fieldProps} variant="group" groupProps={groupProps}>
			<ChoiceList
				type="checkbox"
				options={options}
				orientation={orientation}
				idPrefix={controlId}
				name={field.name}
				selectedValues={value}
				defaultSelectedValues={defaultValue}
				isDisabled={field.isDisabled}
				isReadOnly={field.isReadOnly}
				/* Deliberately not passed. See the prop's own note above and the
				 * longer explanation on ChoiceList's `isRequired`. */
				onOptionChange={handleOptionChange}
			/>
		</FormField>
	)
}

export default CheckboxGroup
