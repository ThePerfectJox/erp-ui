import type { ReactNode } from 'react'
import { classNames } from '../../shared/classNames'
import type { FormFieldChromeProps, FormGroupProps } from '../core/types'

/**
 * How the caption attaches to what it captions. Three structures, because
 * three genuinely different things need naming and HTML has a different
 * construct for each:
 *
 * - `"stacked"` — one control, label above it (or beside it, see
 *   `labelPlacement`). A `<label for>` pointing at the control. The default,
 *   and what every text-like field uses.
 * - `"inline"` — one control, label to its right, both inside a `<label>` so
 *   the text is part of the click target. For a checkbox or a switch, where
 *   the caption reads as the thing being switched rather than as a heading
 *   over it.
 * - `"group"` — several controls under one caption: a `<fieldset>` and a
 *   `<legend>`. A `<label for>` can only ever name one input, so a radio group
 *   has to be a fieldset or its caption is lost.
 */
export type FormFieldVariant = 'stacked' | 'inline' | 'group'

interface FormFieldProps extends FormFieldChromeProps {
	/** Defaults to `"stacked"`. See {@link FormFieldVariant}. */
	variant?: FormFieldVariant

	/**
	 * ARIA for the `<fieldset>`, from `useFormField`. `"group"` fields only — the
	 * fieldset is the thing being described, so the attributes cannot go on any
	 * single control inside it. Ignored by the other variants, where
	 * `controlProps` carries the same information onto the control.
	 */
	groupProps?: FormGroupProps

	/** The control, or controls, this field wraps. */
	children: ReactNode

	/**
	 * Extra chrome under the control but **above** the hint and the message.
	 *
	 * For something that belongs to the control rather than to the field: a
	 * character counter, a list of chosen files. Before this slot existed those
	 * were passed as extra `children`, which put them in the right place by
	 * accident — `children` is rendered before `messages`, so it worked, and it
	 * would have broken silently the first time anything reordered this file.
	 */
	addon?: ReactNode
}

/**
 * Everything around a control: the label, the required marker, the hint and
 * the value-state message. No control renders its own label — they all hand
 * that job here, so a hint sits in the same place and a message reads the same
 * way on every field in the app.
 *
 * You rarely use this directly. `<TextInput>`, `<Select>` and the rest wrap it
 * for you. Reach for it when you need a label and a message around something
 * that is not a plain input — a currency pair, a lookup widget — and want it
 * to match everything else on the screen.
 *
 * Pair it with `useFormField`, which produces the props it expects:
 *
 * ```tsx
 * const { fieldProps, controlProps } = useFormField(field)
 *
 * return (
 *     <FormField {...fieldProps}>
 *         <MyCustomControl {...controlProps} />
 *     </FormField>
 * )
 * ```
 */
function FormField({
	controlId,
	label,
	hint,
	hintId,
	valueState,
	valueStateMessage,
	messageId,
	isRequired,
	isDisabled,
	isReadOnly,
	isLabelHidden,
	labelPlacement,
	className,
	variant = 'stacked',
	groupProps,
	addon,
	children,
}: FormFieldProps) {
	const hasMessage = Boolean(valueState && valueStateMessage)

	const wrapperClassName = classNames(
		'form-field',
		`form-field-${variant}`,
		valueState && `form-field-${valueState}`,
		isDisabled && 'form-field-disabled',
		isReadOnly && 'form-field-readonly',
		/* Only emitted when the field overrides its form. Left off, the field
		 * inherits the placement from the surrounding <Form> or <FormSection>
		 * through CSS, so a form is laid out in one place rather than field by
		 * field. Inline and group fields ignore it: neither has a caption that can
		 * move into the label gutter. */
		labelPlacement && variant === 'stacked' && `form-field-label-${labelPlacement}`,
		className
	)

	/* `erp-visually-hidden` is the shared helper from ../../styles/a11y.css, which
	 * four components use. It keeps the label in the accessibility tree while
	 * taking it off screen. */
	const labelClassName = classNames('form-field-label', isLabelHidden && 'erp-visually-hidden')

	/* Identical in all three branches — only the element carrying it differs —
	 * so it is built once here. */
	const labelContent = (
		<>
			{label}
			{isRequired && (
				/* Hidden from assistive tech on purpose. The control already
				 * carries `required` (or `aria-required` for a group), so a
				 * screen reader announces the field as required; reading the
				 * asterisk too would say it twice. This is the visual half
				 * only. */
				<span className="form-field-required" aria-hidden="true">
					*
				</span>
			)}
		</>
	)

	/* Rendered only when there is text to show, because `aria-describedby`
	 * points at these ids and an id that resolves to nothing can make a screen
	 * reader skip the description entirely. */
	const messages = (
		<>
			{hint && (
				<p id={hintId} className="form-field-hint">
					{hint}
				</p>
			)}
			{hasMessage && (
				<p id={messageId} className="form-field-message">
					{valueStateMessage}
				</p>
			)}
		</>
	)

	/* The order inside .form-field-control, and it is the same in all three
	 * branches: the control, then anything belonging to the control, then the
	 * text describing the field. */
	const control = (
		<div className="form-field-control">
			{children}
			{addon}
			{messages}
		</div>
	)

	if (variant === 'group') {
		return (
			<fieldset {...groupProps} className={wrapperClassName}>
				<legend className={labelClassName}>{labelContent}</legend>
				{control}
			</fieldset>
		)
	}

	if (variant === 'inline') {
		return (
			<div className={wrapperClassName}>
				<div className="form-field-control">
					{/* The <label> wraps the control instead of pointing at it,
					  * which makes the caption text part of the hit area. On a
					  * 16px checkbox that is the difference between a
					  * comfortable target and a fiddly one. */}
					<label htmlFor={controlId} className="form-field-inline-label">
						{children}
						<span className={labelClassName}>{labelContent}</span>
					</label>
					{addon}
					{messages}
				</div>
			</div>
		)
	}

	return (
		<div className={wrapperClassName}>
			<label htmlFor={controlId} className={labelClassName}>
				{labelContent}
			</label>
			{control}
		</div>
	)
}

export default FormField
