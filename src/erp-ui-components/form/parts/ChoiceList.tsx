import type { ChangeEvent } from 'react'
import type { ChoiceOrientation, FieldOption } from '../core/types'

interface ChoiceListProps {
	/**
	 * `"radio"` for one-of, `"checkbox"` for any-of.
	 *
	 * The only structural difference between the two lists. Everything else — the
	 * ids, the label wiring, the descriptions, the disabled rules, the layout — is
	 * identical, which is why this component exists.
	 */
	type: 'radio' | 'checkbox'

	options: readonly FieldOption[]

	orientation: ChoiceOrientation

	/** Base for each option's DOM id. The group's `controlId`. */
	idPrefix: string

	/** Shared by every input. Radios are only mutually exclusive when they share one. */
	name: string | undefined

	/**
	 * The values currently on, or `undefined` for uncontrolled.
	 *
	 * A set for both list types, which is what lets them share this component: a
	 * radio group is a set that happens to hold at most one value, so `RadioGroup`
	 * passes `[value]` and `CheckboxGroup` passes its array straight through. The
	 * alternative — two callbacks, `isChecked` and `isDefaultChecked` — pushed the
	 * difference into this file for no gain.
	 */
	selectedValues: readonly string[] | undefined

	/** Starting state when uncontrolled. Ignored once `selectedValues` is given. */
	defaultSelectedValues: readonly string[] | undefined

	isDisabled?: boolean
	isReadOnly?: boolean

	/**
	 * Puts `required` on every input.
	 *
	 * Radios only. Per the HTML spec, marking any radio in a group required means
	 * one of them must be chosen, so it reads as a group-level constraint even
	 * though it is written on each input. On a **checkbox** the same attribute
	 * means *this* box must be ticked, and the browser would refuse to submit
	 * until every one of them was on — which is not what "pick at least one"
	 * means. `CheckboxGroup` therefore leaves this off and expresses the rule with
	 * `aria-required` on the fieldset plus its own validation.
	 */
	isRequired?: boolean

	onOptionChange: (option: FieldOption, event: ChangeEvent<HTMLInputElement>) => void
}

/**
 * The list of options shared by `RadioGroup` and `CheckboxGroup`.
 *
 * Both were rendering the same thirty-five lines: the orientation wrapper, the
 * id-by-index convention, the disabled calculation, the input, the `<label for>`,
 * and the optional description with its `aria-describedby`. Two copies of markup
 * that detailed is two copies to keep in step, and the id convention in particular
 * is the kind of thing that drifts by one character and silently unlinks every
 * label in one of the two.
 *
 * Note what the per-option `aria-describedby` does *not* include: the group's own
 * hint and message ids. Those sit on the `<fieldset>` via `groupProps`, so a screen
 * reader reads them once when entering the group rather than repeating them on
 * every option.
 */
function ChoiceList({
	type,
	options,
	orientation,
	idPrefix,
	name,
	selectedValues,
	defaultSelectedValues,
	isDisabled,
	isReadOnly,
	isRequired,
	onOptionChange,
}: ChoiceListProps) {
	const isControlled = selectedValues !== undefined
	const inputClassName = type === 'radio' ? 'form-radio' : 'form-checkbox'

	return (
		<div className={`form-choice-list form-choice-list-${orientation}`}>
			{options.map((option, index) => {
				/* Indexed rather than built from the value, so an option whose value
				 * contains a space still produces a usable id for the label to point
				 * at. */
				const optionId = `${idPrefix}-${index}`
				const descriptionId = `${optionId}-description`

				return (
					<div className="form-choice" key={option.value}>
						<input
							type={type}
							id={optionId}
							name={name}
							value={option.value}
							className={inputClassName}
							/* Controlled and uncontrolled are mutually exclusive:
							 * passing both `checked` and `defaultChecked` makes React
							 * warn and one of them silently wins. */
							checked={isControlled ? selectedValues.includes(option.value) : undefined}
							defaultChecked={isControlled ? undefined : defaultSelectedValues?.includes(option.value)}
							disabled={Boolean(isDisabled || isReadOnly || option.isDisabled)}
							required={Boolean(isRequired)}
							aria-describedby={option.description ? descriptionId : undefined}
							onChange={event => onOptionChange(option, event)}
						/>

						<label htmlFor={optionId} className="form-choice-label">
							{option.label}
						</label>

						{option.description && (
							<p id={descriptionId} className="form-choice-description">
								{option.description}
							</p>
						)}
					</div>
				)
			})}
		</div>
	)
}

export default ChoiceList
