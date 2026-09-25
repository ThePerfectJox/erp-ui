/**
 * Shared vocabulary for every control in this folder.
 *
 * All of them take the same block of props — label, hint, required, disabled,
 * read-only, value state — so once you have used one you have used all of
 * them. That is the point: the only thing that differs between a TextInput and
 * a DateInput is the value it holds.
 */

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

/**
 * SAP calls this a field's "value state", and the name is worth keeping: it is
 * the state of the *value*, not of the control. A field is not "an error" — it
 * holds a value that failed a check.
 *
 * Leave it unset for the ordinary case. Each state has a matching fill, a
 * matching underline and a place to put a message, so the four are told apart
 * by more than colour.
 */
export type FieldValueState = 'error' | 'warning' | 'success' | 'information'

/**
 * Where the label sits relative to the control.
 *
 * - `"above"` is the default and the safe choice: it survives narrow screens
 *   and long labels without anything having to wrap awkwardly.
 * - `"beside"` puts labels in a fixed left gutter (`--form-label-width`) for
 *   the dense two-column look of a classic ERP maintenance screen. Every field
 *   in a form shares the one gutter width, so they all line up. Below 768px it
 *   falls back to `"above"` on its own.
 *
 * Set it once on `<Form>` or `<FormSection>` and it is inherited through CSS,
 * so individual fields do not each have to be told.
 */
export type FieldLabelPlacement = 'above' | 'beside'

/** Cozy (36px) is the default; compact (26px) is for dense screens and tables. */
export type FieldDensity = 'cozy' | 'compact'

/**
 * The props every control accepts. Kept as one interface rather than repeated
 * per component so the set cannot drift apart between controls.
 */
export interface FieldBaseProps {
	/**
	 * Visible label. Required, not optional — an unlabelled input is
	 * unusable with a screen reader and merely guessable with one. For the
	 * rare control that genuinely must not show its label, pass
	 * `isLabelHidden` and the text stays available to assistive tech.
	 */
	label: string

	/** Form field name, submitted with the form. */
	name?: string

	/**
	 * Overrides the generated DOM id. Only needed when something outside the
	 * control has to point at it; otherwise leave it alone and a unique id is
	 * generated.
	 */
	id?: string

	/**
	 * Always-visible help text under the control. Use it for the rule a value
	 * has to satisfy ("Must match the supplier's invoice number"), and say it
	 * before the user gets it wrong rather than after.
	 */
	hint?: string

	/** State of the current value. See {@link FieldValueState}. */
	valueState?: FieldValueState

	/**
	 * The message explaining the value state. Pair it with `valueState`: a
	 * state with no message tells the user something is wrong but not what,
	 * and a message with no state has nowhere to render.
	 */
	valueStateMessage?: string

	/**
	 * Marks the field as required: an asterisk on the label and `required` on
	 * the control, so it is announced as well as shown.
	 */
	isRequired?: boolean

	isDisabled?: boolean

	/**
	 * Read-only: the value still reads and still submits, but cannot be
	 * edited. Shown with a dashed underline and no fill, which is a different
	 * shape from disabled rather than just a paler version of it.
	 *
	 * Prefer this over `isDisabled` for a value the user may need to see or
	 * copy — disabled controls are skipped by keyboard navigation.
	 */
	isReadOnly?: boolean

	/** Hides the label visually but keeps it for assistive technology. */
	isLabelHidden?: boolean

	/** Overrides the label placement inherited from the surrounding form. */
	labelPlacement?: FieldLabelPlacement

	/** Extra class names on the field wrapper. */
	className?: string
}

/**
 * Native props a control passes through, minus the ones it derives from
 * {@link FieldBaseProps}. Re-declaring `id` or `disabled` further down would
 * quietly break the label and ARIA wiring, so they are removed from the type
 * and the compiler stops it happening.
 */
type ManagedProps = 'id' | 'name' | 'required' | 'disabled' | 'readOnly' | 'className' | 'aria-invalid' | 'aria-describedby'

/**
 * `prefix` is dropped as well as the managed props. It is a real HTML attribute
 * — the RDFa one, `<input prefix="...">` — typed as `string`, and TextInput and
 * NumberInput reuse the name for the mark shown inside the field, which may be
 * a node. Leaving the native one in place makes the two declarations conflict
 * and neither works. Nothing in an ERP screen needs RDFa, so the name is taken.
 */
export type PassthroughInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, ManagedProps | 'type' | 'prefix'>

export type PassthroughTextAreaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, ManagedProps>

export type PassthroughSelectProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, ManagedProps | 'multiple'>

/** One entry in a Select, RadioGroup or CheckboxGroup. */
export interface FieldOption {
	/** Value submitted with the form. */
	value: string
	/** Text the user reads. */
	label: string
	/** Secondary line, shown under the label. Radio and checkbox groups only. */
	description?: string
	isDisabled?: boolean
}

/**
 * An optional mark shown inside a control — the `logo` on a Button, the affix
 * on a NumberInput.
 *
 * A `string` is treated as an image URL, which is what importing an `.svg`
 * gives you and what the sidebar already passes around:
 *
 * ```tsx
 * import saveIcon from '../assets/save.svg'
 * <Button logo={saveIcon}>Save</Button>
 * ```
 *
 * Anything else renders as-is, for an inline `<svg>` that needs to inherit
 * `currentColor`.
 */
export type FieldAdornment = string | ReactNode
