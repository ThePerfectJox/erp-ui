/**
 * Everything a searchable dropdown does that is not rendering.
 *
 * -----------------------------------------------------------------------------
 * Why this is a hook and not part of the component
 * -----------------------------------------------------------------------------
 * `ComboBox` was 545 lines, and five separate concerns were interleaved in it: a
 * five-piece state machine, an 89-line keyboard switch, the commit-or-revert
 * resolution that runs on blur, the ARIA wiring, and 130 lines of markup. None of
 * them was hard on its own; the file was hard because every one of them could
 * only be understood in terms of the other four.
 *
 * Split this way the component is markup plus attributes, and the interesting
 * questions — what happens when you type something that matches nothing and then
 * tab away, what `ArrowDown` does on a closed box with a selection — are answered
 * in one place, here.
 *
 * -----------------------------------------------------------------------------
 * The two pieces of state that carry the design
 * -----------------------------------------------------------------------------
 * **`draft: string | null`.** `null` means "nothing has been typed since the last
 * commit". It is not the same as `""`. With a selection made and `draft` null the
 * box shows the option's full label and reopening shows the *whole* list; treating
 * the label as filter text instead would reopen to a single row — the one already
 * chosen — which is no use to anyone. `""` means the user has actively emptied the
 * box, which clears the selection on blur.
 *
 * **`activeIndex`**, which is not DOM focus. Focus stays on the input the whole
 * time; the highlighted row is announced through `aria-activedescendant`. That is
 * what the ARIA combobox pattern asks for, and it is why typing keeps working
 * while arrowing through the list.
 */

import { useEffect, useState } from 'react'
import type { FocusEvent, KeyboardEvent, RefObject } from 'react'
import { findSelectableIndex } from '../core/comboBoxMatching'
import type { ComboBoxFilter } from '../core/comboBoxMatching'
import type { FieldOption } from '../core/types'

interface UseComboBoxOptions {
	options: readonly FieldOption[]

	/** Controlled selection. `undefined` puts the hook in charge of it. */
	value?: string

	defaultValue?: string

	onChange?: (value: string) => void

	filter: ComboBoxFilter

	/** False while disabled or read-only. Every gesture is a no-op then. */
	isInteractive: boolean

	/** The control's DOM id, used to derive the listbox and option ids. */
	controlId: string

	/**
	 * The popup's `<ul>`, so the active row can be scrolled into view.
	 *
	 * Passed **in** rather than created here and returned. A hook that hands a DOM
	 * ref back out through its return value makes every read of that return value
	 * look like a ref access during render — which React's compiler flags, and
	 * rightly: the ref is the component's handle on its own markup, and the hook only
	 * needs to borrow it inside an effect.
	 */
	listboxRef: RefObject<HTMLUListElement | null>
}

export interface ComboBoxState {
	isOpen: boolean

	/** What the input shows: the draft while typing, otherwise the selected label. */
	displayValue: string

	/** `null` when nothing has been typed since the last commit. Drives highlighting. */
	draft: string | null

	selectedValue: string
	hasSelection: boolean

	/** The options after filtering. What the popup lists and what the arrows walk. */
	visibleOptions: readonly FieldOption[]

	/** Index into `visibleOptions`, or -1. Not DOM focus. */
	activeIndex: number

	listboxId: string

	/** `aria-activedescendant` for the input, or undefined when nothing is active. */
	activeOptionId: string | undefined

	/** The id for the option at `index`. The popup puts it on each row. */
	optionId: (index: number) => string

	commit: (option: FieldOption) => void
	clear: () => void
	openPopup: () => void
	setActiveIndex: (index: number) => void

	handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void

	/** Goes on the *wrapper*, not the input. See the note on the handler. */
	handleBlur: (event: FocusEvent<HTMLDivElement>) => void

	handleInputChange: (draft: string) => void
}

export function useComboBox({
	options,
	value,
	defaultValue,
	onChange,
	filter,
	isInteractive,
	controlId,
	listboxRef,
}: UseComboBoxOptions): ComboBoxState {
	const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? '')
	const [isOpen, setIsOpen] = useState(false)
	const [draft, setDraft] = useState<string | null>(null)
	const [activeIndex, setActiveIndex] = useState(-1)

	/* The controlled/uncontrolled bridge. Every writer below is guarded by
	 * `value === undefined`, so a controlled combobox never moves until its
	 * parent says so. */
	const selectedValue = value ?? uncontrolledValue

	const selectedOption = options.find(option => option.value === selectedValue)
	const displayValue = draft ?? selectedOption?.label ?? ''

	const visibleOptions = draft === null ? options : options.filter(option => filter(option, draft))

	const listboxId = `${controlId}-listbox`
	const optionId = (index: number) => `${controlId}-option-${index}`
	const activeOption = activeIndex >= 0 ? visibleOptions[activeIndex] : undefined

	/* Keeps the highlighted row on screen while arrowing through a list longer
	 * than the popup. `block: "nearest"` scrolls the popup by the least amount
	 * needed and leaves the page alone. */
	useEffect(() => {
		if (!isOpen || activeIndex < 0) {
			return
		}

		listboxRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' })
	}, [isOpen, activeIndex, listboxRef])

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

	const openAt = (indexToActivate: number) => {
		setIsOpen(true)
		setActiveIndex(indexToActivate)
	}

	const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
		if (!isInteractive) {
			return
		}

		switch (event.key) {
			case 'ArrowDown': {
				/* Arrow keys would otherwise move the text caret, which fights
				 * the row highlight for the user's attention. */
				event.preventDefault()

				if (!isOpen) {
					/* Opens on the current selection rather than the first row, so
					 * Down-Down from a chosen value moves to its neighbour instead
					 * of jumping to the top of the list. */
					const selectedIndex = visibleOptions.findIndex(option => option.value === selectedValue)

					openAt(findSelectableIndex(visibleOptions, selectedIndex >= 0 ? selectedIndex : 0, 1))
					return
				}

				setActiveIndex(findSelectableIndex(visibleOptions, activeIndex + 1, 1))
				return
			}

			case 'ArrowUp':
				event.preventDefault()

				if (!isOpen) {
					openAt(findSelectableIndex(visibleOptions, visibleOptions.length - 1, -1))
					return
				}

				setActiveIndex(findSelectableIndex(visibleOptions, activeIndex - 1, -1))
				return

			case 'Home':
				if (isOpen) {
					event.preventDefault()
					setActiveIndex(findSelectableIndex(visibleOptions, 0, 1))
				}

				return

			case 'End':
				if (isOpen) {
					event.preventDefault()
					setActiveIndex(findSelectableIndex(visibleOptions, visibleOptions.length - 1, -1))
				}

				return

			case 'Enter':
				/* Only swallowed when it is actually picking something. Left alone
				 * otherwise, so Enter still submits the form — which is how people
				 * fill in a form fast, and breaking it is a common fault in
				 * hand-rolled comboboxes. */
				if (isOpen && activeOption) {
					event.preventDefault()
					commit(activeOption)
				}

				return

			case 'Escape':
				/* Stopped from propagating only while open, so Escape closes the
				 * popup here but still reaches a surrounding dialog once the popup
				 * is already shut. */
				if (isOpen) {
					event.stopPropagation()
					revert()
				}

				return

			case 'Tab':
				/* Tab commits rather than discarding. Someone who has arrowed to a
				 * row and pressed Tab has chosen it, and throwing that away because
				 * they used Tab instead of Enter is just rude. */
				if (isOpen && activeOption) {
					commit(activeOption)
				}

				return

			default:
				return
		}
	}

	const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
		/* The clear button lives inside the wrapper, so clicking it moves focus
		 * within the component. Without this check that would read as leaving the
		 * field and close the popup before the click registered.
		 *
		 * relatedTarget is null when focus leaves the window entirely — the field
		 * has not been left, so nothing is committed. */
		if (event.relatedTarget && event.currentTarget.contains(event.relatedTarget)) {
			return
		}

		if (!isOpen && draft === null) {
			return
		}

		/* Leaving the field resolves the typed text, and the value is constrained
		 * to the list:
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

	const handleInputChange = (nextDraft: string) => {
		setDraft(nextDraft)
		setIsOpen(true)

		/* Nothing is pre-highlighted while typing. Enter on a freshly filtered list
		 * should not commit a row the user has not looked at — they have to arrow to
		 * it or click it first. */
		setActiveIndex(-1)
	}

	return {
		isOpen,
		displayValue,
		draft,
		selectedValue,
		hasSelection: selectedValue !== '',
		visibleOptions,
		activeIndex,
		listboxId,
		activeOptionId: activeOption ? optionId(activeIndex) : undefined,
		optionId,
		commit,
		clear,
		openPopup: () => setIsOpen(true),
		setActiveIndex,
		handleKeyDown,
		handleBlur,
		handleInputChange,
	}
}
