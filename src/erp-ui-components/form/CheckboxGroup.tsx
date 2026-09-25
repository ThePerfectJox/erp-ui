import type { ChangeEvent } from 'react'
import FormField from './FormField'
import { splitFieldProps, useFormField } from './useFormField'
import type { FieldBaseProps, FieldOption } from './FieldTypes'
import type { ChoiceOrientation } from './RadioGroup'

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

	const isControlled = value !== undefined

	const handleChange = (optionValue: string, event: ChangeEvent<HTMLInputElement>) => {
		if (!onChange) {
			return
		}

		const previous = value ?? []

		/* Rebuilt by filtering `options` rather than by pushing onto or
		 * splicing the previous array. That keeps the result in the order the
		 * options are declared however the user clicked, and it cannot produce
		 * a duplicate entry. */
		const selected = new Set(previous)

		if (event.target.checked) {
			selected.add(optionValue)
		} else {
			selected.delete(optionValue)
		}

		onChange(
			options.map(option => option.value).filter(candidate => selected.has(candidate)),
			event
		)
	}

	return (
		<FormField {...fieldProps} variant="group" groupProps={groupProps}>
			<div className={`form-choice-list form-choice-list-${orientation}`}>
				{options.map((option, index) => {
					const optionId = `${controlId}-${index}`
					const isOptionDisabled = Boolean(field.isDisabled || field.isReadOnly || option.isDisabled)

					return (
						<div className="form-choice" key={option.value}>
							<input
								type="checkbox"
								id={optionId}
								name={field.name}
								value={option.value}
								className="form-checkbox"
								checked={isControlled ? value.includes(option.value) : undefined}
								defaultChecked={isControlled ? undefined : defaultValue?.includes(option.value)}
								disabled={isOptionDisabled}
								aria-describedby={option.description ? `${optionId}-description` : undefined}
								onChange={event => handleChange(option.value, event)}
							/>
							<label htmlFor={optionId} className="form-choice-label">
								{option.label}
							</label>
							{option.description && (
								<p id={`${optionId}-description`} className="form-choice-description">
									{option.description}
								</p>
							)}
						</div>
					)
				})}
			</div>
		</FormField>
	)
}

export default CheckboxGroup
