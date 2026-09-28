import { useRef } from 'react'
import { classNames } from '../../shared/classNames'
import { matchLabelOrValue } from '../core/comboBoxMatching'
import type { ComboBoxFilter } from '../core/comboBoxMatching'
import { splitFieldProps } from '../core/fieldProps'
import type { FieldBaseProps, FieldOption } from '../core/types'
import { useComboBox } from '../hooks/useComboBox'
import { useFormField } from '../hooks/useFormField'
import FormField from '../parts/FormField'
import HighlightedLabel from '../parts/HighlightedLabel'

interface ComboBoxProps extends FieldBaseProps {
	/** The choices. */
	options: readonly FieldOption[]

	/** Controlled selection: the `value` of the chosen option, or `""` for none. */
	value?: string

	/** Initial selection when uncontrolled. */
	defaultValue?: string

	/** The chosen option's value, or `""` when the selection was cleared. */
	onChange?: (value: string) => void

	/** Shown while nothing is selected. Write it as an instruction: "Search plants". */
	placeholder?: string

	/** Shown when the filter matches nothing. */
	noResultsText?: string

	/**
	 * Overrides the matching rule. The default matches label and value,
	 * case-insensitively, anywhere in the string. Replace it to search a
	 * description too, or to match a code prefix only:
	 *
	 * ```tsx
	 * filter={(option, query) => option.value.startsWith(query)}
	 * ```
	 */
	filter?: ComboBoxFilter

	/** Adds a button that clears the selection. For optional fields. */
	isClearable?: boolean
}

/**
 * A dropdown you can search — type to narrow the list, then pick a row.
 *
 * ```tsx
 * <ComboBox
 *     label="Plant"
 *     name="plant"
 *     placeholder="Search by code or name"
 *     options={[
 *         { value: '1000', label: '1000 — Hamburg', description: 'Northern Europe DC' },
 *         { value: '2000', label: '2000 — Rotterdam' },
 *     ]}
 *     value={plant}
 *     onChange={setPlant}
 *     isRequired
 * />
 * ```
 *
 * -----------------------------------------------------------------------------
 * Where the behaviour lives
 * -----------------------------------------------------------------------------
 * This file is markup and ARIA attributes. Everything else — the state machine,
 * the keyboard map, and the commit-or-revert resolution that runs when focus
 * leaves — is in `useComboBox`, and that is the file to read to find out what a
 * key does or why typing a full code and pressing Tab selects it.
 *
 * | Key | Does |
 * | --- | --- |
 * | `↓` / `↑` | open the list, or move the highlight |
 * | `Home` / `End` | first / last option, while open |
 * | `Enter` | take the highlighted option. Submits the form when nothing is highlighted |
 * | `Tab` | take the highlighted option and move on |
 * | `Esc` | close and put the previous selection back |
 *
 * -----------------------------------------------------------------------------
 * Two things worth knowing
 * -----------------------------------------------------------------------------
 * **The value is constrained to the list.** Free text is never kept: leaving the
 * field either matches exactly one option and takes it, empties the selection, or
 * reverts. So this cannot submit a value the server has never heard of.
 *
 * **The popup is positioned with CSS, not JavaScript** — `position: absolute`
 * below the field. That needs no measuring and no portal, and it has one real
 * limitation: an ancestor that scrolls or hides its overflow will clip the list.
 * Nothing in a `<Form>` does, so this is correct here. A combobox inside a
 * scrolling panel wants the popover API or an anchored portal, which is a
 * different component rather than a flag on this one.
 */
function ComboBox({
	options,
	value,
	defaultValue,
	onChange,
	placeholder,
	noResultsText = 'No matches found',
	filter = matchLabelOrValue,
	isClearable,
	...props
}: ComboBoxProps) {
	const [field] = splitFieldProps(props)
	const { fieldProps, controlProps, controlId } = useFormField(field)

	/* `name` moves to the hidden input at the end — the visible box holds the
	 * option's *label*, and submitting that would post "1000 — Hamburg" where the
	 * server expects "1000". `readOnly` is a real attribute here, on a text input,
	 * so it stays on the element as well as gating interaction. */
	const { name, readOnly, ...inputProps } = controlProps

	const isInteractive = !field.isDisabled && !readOnly

	/* The component owns the DOM handle and lends it to the hook, which needs it only
	 * inside an effect to keep the active row scrolled into view. */
	const listboxRef = useRef<HTMLUListElement>(null)

	const combo = useComboBox({
		options,
		value,
		defaultValue,
		onChange,
		filter,
		isInteractive,
		controlId,
		listboxRef,
	})

	const isClearShown = Boolean(isClearable) && combo.hasSelection && isInteractive

	return (
		<FormField {...fieldProps}>
			{/* onBlur on the wrapper rather than on the input, so moving focus between
			  * the input and the clear button does not count as leaving the field.
			  * React's onBlur bubbles, which makes this possible. */}
			<div className="form-combobox" onBlur={combo.handleBlur}>
				<div className="form-combobox-shell">
					<input
						{...inputProps}
						type="text"
						className="form-control form-combobox-input"
						role="combobox"
						value={combo.displayValue}
						placeholder={placeholder}
						autoComplete="off"
						/* The browser's own suggestion list would cover the popup, and
						 * on a filtered list it is worse than useless. */
						spellCheck={false}
						readOnly={readOnly}
						aria-expanded={combo.isOpen}
						aria-controls={combo.isOpen ? combo.listboxId : undefined}
						/* Points at the highlighted row while focus stays here. This is
						 * what a screen reader announces as you arrow through the list,
						 * and it is why the highlight is an index rather than real DOM
						 * focus. */
						aria-activedescendant={combo.activeOptionId}
						aria-autocomplete="list"
						onChange={event => combo.handleInputChange(event.target.value)}
						onKeyDown={combo.handleKeyDown}
						/* Clicking the box opens it. Someone who clicks a dropdown wants
						 * to see the options, not a text caret. */
						onClick={() => isInteractive && combo.openPopup()}
					/>

					{isClearShown && (
						<button
							type="button"
							className="form-combobox-clear"
							/* Not in the tab order: Escape and selecting a different row
							 * both clear it, and a tab stop beside every field would
							 * double the keystrokes needed to cross the form. */
							tabIndex={-1}
							aria-label={`Clear ${field.label}`}
							onClick={combo.clear}
						>
							<span className="form-combobox-clear-mark" aria-hidden="true" />
						</button>
					)}

					{/* Hidden from assistive tech: the combobox role on the input
					  * already says this opens a list, and the chevron would otherwise
					  * be announced as a second, nameless control. */}
					<span className="form-combobox-chevron" aria-hidden="true" />
				</div>

				{combo.isOpen && isInteractive && (
					<div className="form-combobox-popup">
						{combo.visibleOptions.length === 0 ? (
							/* Deliberately not a listbox — an empty one is announced as
							 * "list, 0 items", which does not explain itself. A plain
							 * live region says what happened. */
							<p className="form-combobox-empty" role="status">
								{noResultsText}
							</p>
						) : (
							<ul
								className="form-combobox-list"
								id={combo.listboxId}
								role="listbox"
								ref={listboxRef}
							>
								{combo.visibleOptions.map((option, index) => {
									const isSelected = option.value === combo.selectedValue

									return (
										<li
											key={option.value}
											id={combo.optionId(index)}
											className={classNames(
												'form-combobox-option',
												index === combo.activeIndex && 'form-combobox-option-active',
												isSelected && 'form-combobox-option-selected',
												option.isDisabled && 'form-combobox-option-disabled'
											)}
											role="option"
											aria-selected={isSelected}
											aria-disabled={option.isDisabled ? true : undefined}
											/* onMouseDown, not onClick: mousedown fires
											 * before the input's blur, so the popup is
											 * still open when the pick is made. With
											 * onClick the blur would close it first and
											 * the click would land on nothing. */
											onMouseDown={event => {
												event.preventDefault()
												combo.commit(option)
											}}
											/* Hovering moves the highlight, so the mouse
											 * and the keyboard cannot disagree about which
											 * row is active. */
											onMouseEnter={() => !option.isDisabled && combo.setActiveIndex(index)}
										>
											<span className="form-combobox-option-label">
												<HighlightedLabel label={option.label} query={combo.draft} />
											</span>

											{option.description && (
												<span className="form-combobox-option-description">
													{option.description}
												</span>
											)}
										</li>
									)
								})}
							</ul>
						)}
					</div>
				)}

				{/* Carries the option's value — not its label — so the form submits
				  * "1000" rather than "1000 — Hamburg". */}
				{name && <input type="hidden" name={name} value={combo.selectedValue} />}
			</div>
		</FormField>
	)
}

export default ComboBox
