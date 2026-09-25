import { useId } from 'react'
import type { FieldBaseProps, FieldLabelPlacement, FieldValueState } from './FieldTypes'

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

/**
 * The chrome half of a field: everything `<FormField>` needs to draw the
 * label, the hint and the value-state message. Produced by
 * {@link useFormField} and spread straight onto `<FormField>`.
 */
export interface FormFieldChromeProps {
	controlId: string
	label: string
	hint?: string
	hintId: string
	valueState?: FieldValueState
	valueStateMessage?: string
	messageId: string
	isRequired?: boolean
	isDisabled?: boolean
	isReadOnly?: boolean
	isLabelHidden?: boolean
	labelPlacement?: FieldLabelPlacement
	className?: string
}

/** ARIA and identity props for a single native `<input>`/`<select>`/`<textarea>`. */
export interface FormControlProps {
	id: string
	name: string | undefined
	required: boolean
	disabled: boolean
	readOnly: boolean
	'aria-invalid': true | undefined
	'aria-describedby': string | undefined
}

/**
 * Same wiring, for a set of controls that share one label — a radio group, a
 * checkbox group. A `<fieldset>` takes no `required` or `readOnly` attribute,
 * so those are expressed with ARIA instead of silently dropped.
 */
export interface FormGroupProps {
	'aria-required': true | undefined
	'aria-invalid': true | undefined
	'aria-describedby': string | undefined
}

export interface UseFormFieldResult {
	/** Spread onto `<FormField>`. */
	fieldProps: FormFieldChromeProps
	/** Spread onto the native control. */
	controlProps: FormControlProps
	/** Spread onto the `<fieldset>` of a grouped control instead. */
	groupProps: FormGroupProps
	/** The control's DOM id, for the rare case a component needs it directly. */
	controlId: string
	/** True when the value state is `"error"`. */
	isInvalid: boolean
}

/**
 * Turns the shared field props into the three things a control actually needs:
 * a unique id, the ARIA attributes that tie the control to its label, hint and
 * message, and the flags that drive the styling.
 *
 * Every control in this folder starts with this hook, which is why they all
 * behave identically and why none of them can be wired up wrongly:
 *
 * ```tsx
 * function TextInput({ value, onChange, ...field }: TextInputProps) {
 *     const { fieldProps, controlProps } = useFormField(field)
 *
 *     return (
 *         <FormField {...fieldProps}>
 *             <input {...controlProps} className="form-control" value={value} onChange={onChange} />
 *         </FormField>
 *     )
 * }
 * ```
 *
 * Two details worth knowing:
 *
 * - `aria-describedby` points at the hint and the message *only when they are
 *   rendered*. Pointing at an element that is not in the DOM makes some
 *   screen readers announce nothing at all, which is worse than staying quiet.
 * - `aria-invalid` is set for `"error"` and nothing else. Warning, success and
 *   information are not invalid — a field can be perfectly valid and still
 *   worth commenting on, and marking those as invalid would cry wolf.
 */
export function useFormField(props: FieldBaseProps): UseFormFieldResult {
	/* React generates this once per mounted component, so two instances of the
	 * same field on one screen still get distinct ids and their labels still
	 * point at the right control. */
	const generatedId = useId()
	const controlId = props.id ?? generatedId
	const hintId = `${controlId}-hint`
	const messageId = `${controlId}-message`

	const isInvalid = props.valueState === 'error'
	const hasHint = Boolean(props.hint)
	const hasMessage = Boolean(props.valueState && props.valueStateMessage)

	/* Order matters: the hint describes the field, the message reacts to what
	 * was typed into it, so the hint is announced first. */
	const describedByIds: string[] = []

	if (hasHint) {
		describedByIds.push(hintId)
	}

	if (hasMessage) {
		describedByIds.push(messageId)
	}

	const describedBy = describedByIds.length > 0 ? describedByIds.join(' ') : undefined

	return {
		controlId,
		isInvalid,

		fieldProps: {
			controlId,
			label: props.label,
			hint: props.hint,
			hintId,
			valueState: props.valueState,
			valueStateMessage: props.valueStateMessage,
			messageId,
			isRequired: props.isRequired,
			isDisabled: props.isDisabled,
			isReadOnly: props.isReadOnly,
			isLabelHidden: props.isLabelHidden,
			labelPlacement: props.labelPlacement,
			className: props.className,
		},

		controlProps: {
			id: controlId,
			name: props.name,
			required: Boolean(props.isRequired),
			disabled: Boolean(props.isDisabled),
			readOnly: Boolean(props.isReadOnly),
			'aria-invalid': isInvalid ? true : undefined,
			'aria-describedby': describedBy,
		},

		groupProps: {
			'aria-required': props.isRequired ? true : undefined,
			'aria-invalid': isInvalid ? true : undefined,
			'aria-describedby': describedBy,
		},
	}
}
