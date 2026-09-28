/**
 * Prop plumbing: splitting what the wrapper needs from what the DOM node needs,
 * and resolving `readOnly` for the controls HTML does not support it on.
 *
 * Both are pure functions of their arguments, no React.
 */

import type { FieldBaseProps, FormControlProps } from './types'

/**
 * Separates the shared field props from the native ones a control forwards to
 * its `<input>`, `<select>` or `<textarea>`.
 *
 * Every control needs this and the split has to be exact — miss `isReadOnly`
 * here and React warns about an unknown `isReadOnly` attribute on a DOM node;
 * miss `label` and the word "label" ends up as an HTML attribute. Doing it once
 * means there is one list to keep right rather than ten:
 *
 * ```tsx
 * function TextInput(props: TextInputProps) {
 *     const [field, nativeProps] = splitFieldProps(props)
 *     const { fieldProps, controlProps } = useFormField(field)
 *     ...
 * }
 * ```
 *
 * The destructured key list is the one thing here that must stay in step with
 * {@link FieldBaseProps}. Adding a shared prop without adding it here leaks it
 * onto the DOM node.
 */
export function splitFieldProps<TProps extends FieldBaseProps>(
	props: TProps
): [FieldBaseProps, Omit<TProps, keyof FieldBaseProps>] {
	const {
		label,
		name,
		id,
		hint,
		valueState,
		valueStateMessage,
		isRequired,
		isDisabled,
		isReadOnly,
		isLabelHidden,
		labelPlacement,
		className,
		...nativeProps
	} = props

	return [
		{
			label,
			name,
			id,
			hint,
			valueState,
			valueStateMessage,
			isRequired,
			isDisabled,
			isReadOnly,
			isLabelHidden,
			labelPlacement,
			className,
		},
		nativeProps as Omit<TProps, keyof FieldBaseProps>,
	]
}

/** {@link FormControlProps} with the unsupported `readOnly` swapped for ARIA. */
export interface NonNativeReadOnlyProps extends Omit<FormControlProps, 'readOnly'> {
	'aria-readonly': true | undefined
}

/**
 * Takes `readOnly` off a control's props and hands it back as a flag, adding
 * `aria-readonly` in its place.
 *
 * -----------------------------------------------------------------------------
 * Why this exists
 * -----------------------------------------------------------------------------
 * `readOnly` is a real HTML attribute on exactly two things: a text `<input>`
 * and a `<textarea>`. On a `<select>` it is not valid at all and React warns
 * about it; on a checkbox or a file input the browser accepts the attribute and
 * then ignores it — the control stays fully operable, which is worse than an
 * error because it looks like it worked.
 *
 * So four controls have to emulate read-only, and before this helper all four
 * did it by hand with `const { readOnly, ...rest } = controlProps`. Four copies
 * drifted, as four copies do: `FileInput` was the one that forgot
 * `aria-readonly`, so its read-only state was visible but never announced.
 *
 * -----------------------------------------------------------------------------
 * What it deliberately does NOT decide
 * -----------------------------------------------------------------------------
 * Whether to also **disable** the control. That genuinely differs, and folding it
 * in here would force one wrong answer on somebody:
 *
 * - **Checkbox, Switch, FileInput** disable, because there is no other way to
 *   stop the click. Disabling drops the value from the submitted form, so the
 *   first two pair this with `<ReadOnlySubmitValue>` to put it back.
 * - **Select** does not. It keeps a real, focusable, submitting `<select>` and
 *   filters the options down to the chosen one instead, so there is nothing to
 *   change. Disabling it would remove it from keyboard navigation, and a value
 *   the user cannot even reach to read is not read-only, it is hidden.
 *
 * ```tsx
 * const [checkboxProps, isReadOnly] = extractReadOnly(controlProps)
 *
 * <input {...checkboxProps} disabled={checkboxProps.disabled || isReadOnly} />
 * ```
 */
export function extractReadOnly(controlProps: FormControlProps): [NonNativeReadOnlyProps, boolean] {
	const { readOnly, ...rest } = controlProps

	return [
		{
			...rest,
			/* Undefined rather than false, so the attribute is absent on an
			 * editable control instead of present and saying "no". */
			'aria-readonly': readOnly ? true : undefined,
		},
		readOnly,
	]
}
