import type { ChangeEvent } from 'react'
import FormField from './FormField'
import { splitFieldProps, useFormField } from './useFormField'
import type { FieldBaseProps, FieldOption } from './FieldTypes'

/** Stacked, or in a row. Rows only for two or three short options. */
export type ChoiceOrientation = 'vertical' | 'horizontal'

interface RadioGroupProps extends FieldBaseProps {
	/** The choices. Two or more; one radio button on its own is a checkbox. */
	options: readonly FieldOption[]

	/** Controlled selection. */
	value?: string

	/** Initial selection when uncontrolled. */
	defaultValue?: string

	/**
	 * The chosen value, already unwrapped — radios put the value on the
	 * individual input, so reading `event.target.value` off a group handler is
	 * a step every caller would otherwise repeat. The event is still passed in
	 * case you need `preventDefault` or the element itself.
	 */
	onChange?: (value: string, event: ChangeEvent<HTMLInputElement>) => void

	/** Defaults to `"vertical"`. */
	orientation?: ChoiceOrientation
}

/**
 * One choice out of several, all visible at once.
 *
 * ```tsx
 * <RadioGroup
 *     label="Delivery priority"
 *     name="priority"
 *     options={[
 *         { value: 'standard', label: 'Standard', description: 'Ships within 5 working days' },
 *         { value: 'express', label: 'Express', description: 'Next working day, surcharge applies' },
 *         { value: 'pickup', label: 'Customer pickup' },
 *     ]}
 *     value={priority}
 *     onChange={setPriority}
 *     isRequired
 * />
 * ```
 *
 * Use this over `<Select>` when the options matter enough to be compared —
 * shipping methods, payment terms, anything with a `description`. Use `<Select>`
 * past about seven options, or when the choice is a lookup rather than a
 * decision.
 *
 * Radios cannot be unset once set, so if "none of these" is a legitimate answer
 * it has to be an option in its own right.
 */
function RadioGroup({ options, value, defaultValue, onChange, orientation = 'vertical', ...props }: RadioGroupProps) {
	const [field] = splitFieldProps(props)
	const { fieldProps, groupProps, controlId } = useFormField(field)

	/* Radios are only mutually exclusive when they share a name, so a group
	 * without one would let the user pick every option at once. Falling back to
	 * the generated id keeps that working even when the form is not being
	 * submitted natively and nobody thought to pass a name. */
	const groupName = field.name ?? controlId

	const isControlled = value !== undefined

	return (
		<FormField {...fieldProps} variant="group" groupProps={groupProps}>
			<div className={`form-choice-list form-choice-list-${orientation}`}>
				{options.map((option, index) => {
					/* Indexed rather than built from the value, so an option
					 * whose value contains a space still produces a usable id
					 * for the label to point at. */
					const optionId = `${controlId}-${index}`
					const isOptionDisabled = Boolean(field.isDisabled || field.isReadOnly || option.isDisabled)

					return (
						<div className="form-choice" key={option.value}>
							<input
								type="radio"
								id={optionId}
								name={groupName}
								value={option.value}
								className="form-radio"
								/* Controlled and uncontrolled are mutually
								 * exclusive on a radio: passing both `checked`
								 * and `defaultChecked` makes React warn and one
								 * of them silently wins. */
								checked={isControlled ? value === option.value : undefined}
								defaultChecked={isControlled ? undefined : defaultValue === option.value}
								disabled={isOptionDisabled}
								/* Per the HTML spec, marking any radio in a
								 * group required means one of them must be
								 * chosen — so this is a group-level constraint
								 * even though it is written on each input. */
								required={Boolean(field.isRequired)}
								aria-describedby={option.description ? `${optionId}-description` : undefined}
								onChange={event => onChange?.(option.value, event)}
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

export default RadioGroup
