import type { ChangeEvent } from 'react'
import { splitFieldProps } from '../core/fieldProps'
import type { ChoiceOrientation, FieldBaseProps, FieldOption } from '../core/types'
import { useFormField } from '../hooks/useFormField'
import ChoiceList from '../parts/ChoiceList'
import FormField from '../parts/FormField'

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

	return (
		<FormField {...fieldProps} variant="group" groupProps={groupProps}>
			<ChoiceList
				type="radio"
				options={options}
				orientation={orientation}
				idPrefix={controlId}
				name={groupName}
				/* A radio group is a selection set that holds at most one value, which
				 * is what lets it share `ChoiceList` with the checkbox group. */
				selectedValues={value !== undefined ? [value] : undefined}
				defaultSelectedValues={defaultValue !== undefined ? [defaultValue] : undefined}
				isDisabled={field.isDisabled}
				isReadOnly={field.isReadOnly}
				/* Safe on a radio, and the browser reads it as a group-level rule:
				 * one of the set must be chosen. Not safe on a checkbox — see the
				 * note on ChoiceList's `isRequired`. */
				isRequired={field.isRequired}
				onOptionChange={(option, event) => onChange?.(option.value, event)}
			/>
		</FormField>
	)
}

export default RadioGroup
