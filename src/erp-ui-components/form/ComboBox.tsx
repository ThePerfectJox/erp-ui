import { useEffect, useRef, useState } from 'react'
import type { FocusEvent, KeyboardEvent, ReactNode } from 'react'
import FormField from './FormField'
import { splitFieldProps, useFormField } from './useFormField'
import type { FieldBaseProps, FieldOption } from './FieldTypes'

/** Decides whether an option survives the filter text. Return `true` to keep it. */
export type ComboBoxFilter = (option: FieldOption, query: string) => boolean

/**
 * Case-insensitive substring match on the label *and* the value.
 *
 * Matching the value matters more than it looks. ERP options are usually
 * `"1000 — Hamburg"`, and whoever is filling the form often knows the code but
 * not the name, or the other way round. Matching both means typing `1000` and
 * typing `ham` land on the same row.
 *
 * Substring rather than prefix, for the same reason: `"Hamburg"` has to be
 * reachable in a list where every label starts with its plant number.
 */
const matchLabelOrValue: ComboBoxFilter = (option, query) => {
	const needle = query.trim().toLowerCase()

	if (needle === '') {
		return true
	}

	return option.label.toLowerCase().includes(needle) || option.value.toLowerCase().includes(needle)
}

/**
 * Wraps the matched run of characters in a `<mark>`, so the reason a row is in
 * the list is visible. In a filtered list of forty codes that all look alike,
 * that is the difference between reading and scanning.
 *
 * `<mark>` rather than a `<span>`: it means "relevant to the user's current
 * activity", which is exactly this.
 */
function highlightMatch(label: string, query: string): ReactNode {
	const needle = query.trim()

	if (needle === '') {
		return label
	}

	const at = label.toLowerCase().indexOf(needle.toLowerCase())

	/* The option may have matched on its value rather than its label, in which
	 * case there is nothing in the label to mark. */
	if (at === -1) {
		return label
	}

	return (
		<>
			{label.slice(0, at)}
			<mark className="form-combobox-match">{label.slice(at, at + needle.length)}</mark>
			{label.slice(at + needle.length)}
		</>
	)
}

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
 * Use it over `<Select>` past roughly twenty options, or whenever the user is
 * more likely to know what they are looking for than to recognise it in a list —
 * material numbers, cost centres, G/L accounts. Below twenty options a native
 * `<Select>` is the better tool: no JavaScript, and the platform's own picker on
 * a phone.
 *
 * **The value is constrained to the list.** Typing something unmatched and
 * leaving the field restores the previous selection rather than keeping the
 * text, so an invalid code cannot be submitted. Emptying the box and leaving it
 * clears the selection.
 *
 * Keyboard, following the ARIA combobox pattern:
 *
 * | Key | Closed | Open |
 * | --- | --- | --- |
 * | `Down` | opens at the selected row | next row |
 * | `Up` | opens at the last row | previous row |
 * | `Home` / `End` | — | first / last row |
 * | `Enter` | submits the form | picks the active row |
 * | `Esc` | — | closes, restores the selection |
 * | `Tab` | moves on | picks the active row, then moves on |
 * | typing | opens and filters | filters |
 *
 * Focus stays on the text box throughout. The highlighted row is tracked with
 * `aria-activedescendant` rather than by moving focus, which is what lets you
 * keep typing while a row is highlighted.
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
	 * option's *label*, and submitting that would post "1000 — Hamburg" where
	 * the server expects "1000". */
	const { name, readOnly, ...inputProps } = controlProps

	const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? '')
	const selectedValue = value ?? uncontrolledValue

	const [isOpen, setIsOpen] = useState(false)

	/**
	 * What the user has typed, or `null` when they have not typed anything since
	 * the last commit.
	 *
	 * That null is what makes this behave the way people expect: with a
	 * selection made, the box shows its full label and reopening shows the
	 * *whole* list. Treating the label as filter text instead would reopen to a
	 * single row — the one already chosen — which is no use to anyone.
	 */
	const [draft, setDraft] = useState<string | null>(null)

	/** Index into `visibleOptions`, or -1 for none. Not DOM focus. */
	const [activeIndex, setActiveIndex] = useState(-1)

	const listboxRef = useRef<HTMLUListElement>(null)

	const isInteractive = !field.isDisabled && !readOnly

	const selectedOption = options.find(option => option.value === selectedValue)
	const displayValue = draft ?? selectedOption?.label ?? ''

	const visibleOptions = draft === null ? options : options.filter(option => filter(option, draft))

	const activeOption = activeIndex >= 0 ? visibleOptions[activeIndex] : undefined
	const listboxId = `${controlId}-listbox`
	const activeOptionId = activeOption ? `${controlId}-option-${activeIndex}` : undefined

	/* Keeps the highlighted row on screen while arrowing through a list longer
	 * than the popup. `block: "nearest"` scrolls the popup by the least amount
	 * needed and leaves the page alone. */
	useEffect(() => {
		if (!isOpen || activeIndex < 0) {
			return
		}

		listboxRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' })
	}, [isOpen, activeIndex])

	/**
	 * First selectable option at or after `start`, stepping by `step` and
	 * wrapping at both ends. Returns -1 when every option is disabled, so
	 * arrowing through a fully disabled list cannot loop forever.
	 */
	const findSelectable = (start: number, step: number): number => {
		const count = visibleOptions.length

		if (count === 0) {
			return -1
		}

		for (let offset = 0; offset < count; offset += 1) {
			/* The double modulo is what makes a negative index wrap to the end
			 * of the list: in JavaScript -1 % 5 is -1, not 4. */
			const index = (((start + step * offset) % count) + count) % count

			if (!visibleOptions[index].isDisabled) {
				return index
			}
		}

		return -1
	}

	const commit = (option: FieldOption) => {
		if (option.isDisabled) {
			return
		}

		if (value === undefined) {
			setUncontrolledValue(option.value)
		}

		onChange?.(option.value)

		/* Back to null, not to the option's label: the box goes back to
		 * displaying the selection rather than treating it as a filter, so
		 * reopening shows the whole list again. */
		setDraft(null)
		setActiveIndex(-1)
		setIsOpen(false)
	}

	const clear = () => {
		if (value === undefined) {
			setUncontrolledValue('')
		}

		onChange?.('')
		setDraft(null)
		setActiveIndex(-1)
	}

	/** Discards whatever was typed and goes back to the committed selection. */
	const revert = () => {
		setDraft(null)
		setActiveIndex(-1)
		setIsOpen(false)
	}

	const open = (indexToActivate: number) => {
		setIsOpen(true)
		setActiveIndex(indexToActivate)
	}

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (!isInteractive) {
			return
		}

		switch (event.key) {
			case 'ArrowDown':
				/* Arrow keys would otherwise move the text caret, which fights
				 * the row highlight for the user's attention. */
				event.preventDefault()

				if (!isOpen) {
					/* Opens on the current selection rather than the first row,
					 * so Down-Down from a chosen value moves to its neighbour
					 * instead of jumping to the top of the list. */
					const selectedIndex = visibleOptions.findIndex(option => option.value === selectedValue)

					open(findSelectable(selectedIndex >= 0 ? selectedIndex : 0, 1))
					return
				}

				setActiveIndex(findSelectable(activeIndex + 1, 1))
				return

			case 'ArrowUp':
				event.preventDefault()

				if (!isOpen) {
					open(findSelectable(visibleOptions.length - 1, -1))
					return
				}

				setActiveIndex(findSelectable(activeIndex - 1, -1))
				return

			case 'Home':
				if (isOpen) {
					event.preventDefault()
					setActiveIndex(findSelectable(0, 1))
				}

				return

			case 'End':
				if (isOpen) {
					event.preventDefault()
					setActiveIndex(findSelectable(visibleOptions.length - 1, -1))
				}

				return

			case 'Enter':
				/* Only swallowed when it is actually picking something. Left
				 * alone otherwise, so Enter still submits the form — which is
				 * how people fill in a form fast, and breaking it is a common
				 * fault in hand-rolled comboboxes. */
				if (isOpen && activeOption) {
					event.preventDefault()
					commit(activeOption)
				}

				return

			case 'Escape':
				/* Stopped from propagating only while open, so Escape closes the
				 * popup here but still reaches a surrounding dialog once the
				 * popup is already shut. */
				if (isOpen) {
					event.stopPropagation()
					revert()
				}

				return

			case 'Tab':
				/* Tab commits rather than discarding. Someone who has arrowed to
				 * a row and pressed Tab has chosen it, and throwing that away
				 * because they used Tab instead of Enter is just rude. */
				if (isOpen && activeOption) {
					commit(activeOption)
				}

				return

			default:
				return
		}
	}

	const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
		/* The clear button lives inside this wrapper, so clicking it moves focus
		 * within the component. Without this check that would read as leaving
		 * the field and close the popup before the click registered.
		 *
		 * relatedTarget is null when focus leaves the window entirely — the
		 * field has not been left, so nothing is committed. */
		if (event.relatedTarget && event.currentTarget.contains(event.relatedTarget)) {
			return
		}

		if (!isOpen && draft === null) {
			return
		}

		/* Leaving the field resolves the typed text, and the value is
		 * constrained to the list:
		 *
		 *   emptied        → clears the selection
		 *   exactly one    → takes it, so typing a full code and tabbing works
		 *                    without ever opening the popup
		 *   anything else  → reverts, because a free-text value is not a valid
		 *                    option and silently keeping it would submit junk */
		if (draft !== null) {
			if (draft.trim() === '') {
				clear()
				setIsOpen(false)
				return
			}

			const selectable = visibleOptions.filter(option => !option.isDisabled)

			if (selectable.length === 1) {
				commit(selectable[0])
				return
			}
		}

		revert()
	}

	const handleChange = (nextDraft: string) => {
		setDraft(nextDraft)
		setIsOpen(true)

		/* Nothing is pre-highlighted while typing. Enter on a freshly filtered
		 * list should not commit a row the user has not looked at — they have to
		 * arrow to it or click it first. */
		setActiveIndex(-1)
	}

	const hasSelection = selectedValue !== ''
	const isClearShown = Boolean(isClearable) && hasSelection && isInteractive

	return (
		<FormField {...fieldProps}>
			{/* onBlur on the wrapper rather than on the input, so moving focus
			  * between the input and the clear button does not count as leaving
			  * the field. React's onBlur bubbles, which makes this possible. */}
			<div className="form-combobox" onBlur={handleBlur}>
				<div className="form-combobox-shell">
					<input
						{...inputProps}
						type="text"
						className="form-control form-combobox-input"
						role="combobox"
						value={displayValue}
						placeholder={placeholder}
						autoComplete="off"
						/* The browser's own suggestion list would cover the
						 * popup, and on a filtered list it is worse than useless. */
						spellCheck={false}
						readOnly={readOnly}
						aria-expanded={isOpen}
						aria-controls={isOpen ? listboxId : undefined}
						/* Points at the highlighted row while focus stays here.
						 * This is what a screen reader announces as you arrow
						 * through the list. */
						aria-activedescendant={activeOptionId}
						aria-autocomplete="list"
						onChange={event => handleChange(event.target.value)}
						onKeyDown={handleKeyDown}
						/* Clicking the box opens it. Someone who clicks a
						 * dropdown wants to see the options, not a text caret. */
						onClick={() => isInteractive && setIsOpen(true)}
					/>

					{isClearShown && (
						<button
							type="button"
							className="form-combobox-clear"
							/* Not in the tab order: Escape and selecting a
							 * different row both clear it, and a tab stop
							 * between every field would double the keystrokes
							 * needed to cross the form. */
							tabIndex={-1}
							aria-label={`Clear ${field.label}`}
							onClick={clear}
						>
							<span className="form-combobox-clear-mark" aria-hidden="true" />
						</button>
					)}

					{/* Hidden from assistive tech: the combobox role on the input
					  * already says this opens a list, and the chevron would
					  * otherwise be announced as a second, nameless control. */}
					<span className="form-combobox-chevron" aria-hidden="true" />
				</div>

				{isOpen && isInteractive && (
					<div className="form-combobox-popup">
						{visibleOptions.length === 0 ? (
							/* Deliberately not a listbox — an empty one is
							 * announced as "list, 0 items", which does not
							 * explain itself. A plain live region says what
							 * happened. */
							<p className="form-combobox-empty" role="status">
								{noResultsText}
							</p>
						) : (
							<ul className="form-combobox-list" id={listboxId} role="listbox" ref={listboxRef}>
								{visibleOptions.map((option, index) => {
									const isSelected = option.value === selectedValue

									const classNames = ['form-combobox-option']

									if (index === activeIndex) {
										classNames.push('form-combobox-option-active')
									}

									if (isSelected) {
										classNames.push('form-combobox-option-selected')
									}

									if (option.isDisabled) {
										classNames.push('form-combobox-option-disabled')
									}

									return (
										<li
											key={option.value}
											id={`${controlId}-option-${index}`}
											className={classNames.join(' ')}
											role="option"
											aria-selected={isSelected}
											aria-disabled={option.isDisabled ? true : undefined}
											/* onMouseDown, not onClick: mousedown
											 * fires before the input's blur, so
											 * the popup is still open when the
											 * pick is made. With onClick the blur
											 * would close it first and the click
											 * would land on nothing. */
											onMouseDown={event => {
												event.preventDefault()
												commit(option)
											}}
											/* Hovering moves the highlight, so
											 * the mouse and the keyboard cannot
											 * disagree about which row is
											 * active. */
											onMouseEnter={() => !option.isDisabled && setActiveIndex(index)}
										>
											<span className="form-combobox-option-label">
												{draft === null ? option.label : highlightMatch(option.label, draft)}
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

				{/* Carries the option's value — not its label — so the form
				  * submits "1000" rather than "1000 — Hamburg". */}
				{name && <input type="hidden" name={name} value={selectedValue} />}
			</div>
		</FormField>
	)
}

export default ComboBox
