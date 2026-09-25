import { useState } from 'react'
import type { ChangeEvent } from 'react'
import FormField from './FormField'
import { splitFieldProps, useFormField } from './useFormField'
import type { FieldBaseProps, PassthroughTextAreaProps } from './FieldTypes'

interface TextAreaProps extends FieldBaseProps, PassthroughTextAreaProps {
	/** Visible rows before the box scrolls. Defaults to 3. */
	rows?: number

	/**
	 * Shows a `used / limit` counter under the box. Needs `maxLength` to have
	 * something to count against; without it the prop is ignored.
	 *
	 * The counter is decorative — `maxLength` on the element is what assistive
	 * tech reads, and a live region that fires on every keystroke is worse than
	 * no announcement at all. If the limit matters, say so in `hint` too.
	 */
	hasCounter?: boolean
}

/**
 * Multi-line text entry: notes, internal comments, delivery instructions.
 *
 * ```tsx
 * <TextArea
 *     label="Header note"
 *     rows={4}
 *     maxLength={500}
 *     hasCounter
 *     value={note}
 *     onChange={event => setNote(event.target.value)}
 * />
 * ```
 */
function TextArea({ rows = 3, hasCounter, onChange, ...props }: TextAreaProps) {
	const [field, nativeProps] = splitFieldProps(props)
	const { fieldProps, controlProps } = useFormField(field)

	const { value, defaultValue, maxLength } = nativeProps

	/* Only consulted while the component is uncontrolled. Seeding it from
	 * defaultValue means the counter is right on first paint rather than
	 * claiming 0 under text that is already in the box. */
	const [uncontrolledLength, setUncontrolledLength] = useState(
		typeof defaultValue === 'string' ? defaultValue.length : 0
	)

	/* A controlled textarea's length is whatever the parent says it is, and
	 * reading it from the prop keeps the counter honest even when the parent
	 * transforms or truncates what was typed. Falling back to internal state
	 * covers the uncontrolled case, so both work. */
	const currentLength = typeof value === 'string' ? value.length : uncontrolledLength

	const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
		setUncontrolledLength(event.target.value.length)
		onChange?.(event)
	}

	const isCounterShown = hasCounter && typeof maxLength === 'number'

	return (
		<FormField {...fieldProps}>
			<textarea
				{...nativeProps}
				{...controlProps}
				rows={rows}
				className="form-control form-control-textarea"
				onChange={handleChange}
			/>
			{isCounterShown && (
				<p className="form-control-counter" aria-hidden="true">
					{currentLength} / {maxLength}
				</p>
			)}
		</FormField>
	)
}

export default TextArea
