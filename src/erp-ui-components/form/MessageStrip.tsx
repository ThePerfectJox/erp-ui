import type { ReactNode } from 'react'
import type { FieldValueState } from './FieldTypes'

interface MessageStripProps {
	/**
	 * Which kind of message this is. Same four states a field uses, so the
	 * colours and wording a user learns on one apply to the other.
	 */
	valueState: FieldValueState

	/**
	 * Announces the message the moment it appears, for a strip rendered in
	 * response to something the user did — a failed save, a posted document.
	 *
	 * Leave it off for a strip that is simply part of the screen on load: an
	 * alert that fires during page load interrupts whatever the screen reader
	 * was reading, and the user has no idea what was cut off.
	 */
	isLive?: boolean

	children?: ReactNode
}

/**
 * A form-level message: the banner over a form that explains why the last save
 * failed, or confirms that it worked.
 *
 * ```tsx
 * {error && (
 *     <MessageStrip valueState="error" isLive>
 *         3 fields need attention before this purchase order can be saved.
 *     </MessageStrip>
 * )}
 *
 * <MessageStrip valueState="information">
 *     This purchase order is locked by another user and opened read-only.
 * </MessageStrip>
 * ```
 *
 * Pair it with per-field `valueState` rather than replacing it. The strip says
 * *that* something is wrong and is visible without scrolling; the field says
 * *what* is wrong and is next to the thing to fix. A form that only has the
 * strip leaves the user hunting; one that only has field states leaves them
 * wondering why Save did nothing.
 *
 * The state is marked with a leading bar and a bold prefix as well as colour —
 * a red and a green strip have to be distinguishable in greyscale.
 */
function MessageStrip({ valueState, isLive, children }: MessageStripProps) {
	/* The visible prefix is the non-colour half of the signal. It is real text,
	 * not an ::before, so it is read out and it survives a stylesheet failing
	 * to load. */
	const prefixes: Record<FieldValueState, string> = {
		error: 'Error',
		warning: 'Warning',
		success: 'Success',
		information: 'Information',
	}

	return (
		<div
			className={`form-message-strip form-message-strip-${valueState}`}
			/* `alert` is assertive and interrupts; `status` is polite and waits
			 * for a gap. An error the user just caused earns the interruption,
			 * and everything else does not. Neither is set when the strip is
			 * not live, so a static strip is just part of the page. */
			role={isLive ? (valueState === 'error' ? 'alert' : 'status') : undefined}
		>
			<span className="form-message-strip-prefix">{prefixes[valueState]}:</span>{' '}
			<span className="form-message-strip-text">{children}</span>
		</div>
	)
}

export default MessageStrip
