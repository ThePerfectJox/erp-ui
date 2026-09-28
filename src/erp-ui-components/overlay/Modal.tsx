import { useEffect, useId, useRef } from 'react'
import type { MouseEvent, PointerEvent, ReactNode } from 'react'
import { classNames } from '../shared/classNames'
import './Modal.css'

/**
 * How wide the dialog is.
 *
 * Widths, not heights — the dialog is always as tall as its content up to a cap,
 * and its body scrolls past that. Sizing by content height instead would make a
 * dialog's frame jump about as fields appear and disappear inside it.
 *
 * - `"small"`  28rem. A confirmation, a single field, a message.
 * - `"medium"` 40rem. The default. A short form.
 * - `"large"`  64rem. A form with two columns, or a table.
 * - `"full"`   the viewport, less a margin. For a dialog holding a grid, where
 *              the content genuinely wants every pixel available.
 */
export type ModalSize = 'small' | 'medium' | 'large' | 'full'

interface ModalProps {
	/**
	 * Whether the dialog is showing. Controlled — the dialog never closes itself,
	 * it asks through `onClose`.
	 *
	 * That is deliberate for an ERP screen: closing a dialog is frequently not
	 * unconditional. "Discard the three changes you have made?" is a decision the
	 * screen owns, and a dialog that had already closed itself before asking has
	 * taken it away.
	 */
	isOpen: boolean

	/**
	 * Asked to close: the × was pressed, `Esc` was pressed, or the backdrop was
	 * clicked. Set `isOpen` to false from here — or do not, and the dialog stays
	 * put.
	 */
	onClose: () => void

	/**
	 * The heading, and the dialog's accessible name. Required: a dialog with no
	 * name is announced as just "dialog", which tells a screen reader user that
	 * something has taken over the screen but not what.
	 */
	title: string

	/**
	 * A line under the heading, for the question the dialog is asking or the
	 * consequence of the action. Wired up as the dialog's accessible description,
	 * so it is read out after the title rather than only being visible.
	 */
	description?: string

	/**
	 * The dialog's content. **Anything** — fields, a `DataGrid`, a chart, plain
	 * text, several sections. The modal owns the frame, the header, the footer and
	 * the behaviour; it has no opinion at all about what goes between them.
	 *
	 * Only mounted while `isOpen`. So a form inside starts blank every time it is
	 * opened rather than remembering the last attempt, a grid inside does not
	 * render five hundred rows on a screen where the dialog is never used, and an
	 * `autoFocus` on a field inside works on every open instead of only the first.
	 */
	children: ReactNode

	/**
	 * The action bar along the bottom. Buttons, in reading order, with the
	 * confirming one last so it lands rightmost:
	 *
	 * ```tsx
	 * footer={
	 *     <>
	 *         <Button variant="transparent" onClick={close}>Cancel</Button>
	 *         <Button variant="negative" onClick={remove}>Delete</Button>
	 *     </>
	 * }
	 * ```
	 *
	 * Left off, there is no bar — right for a dialog that only shows something,
	 * where the × and `Esc` are the whole interaction.
	 */
	footer?: ReactNode

	/** Defaults to `"medium"`. See {@link ModalSize}. */
	size?: ModalSize

	/**
	 * Blocks `Esc` and clicking the backdrop, leaving only the buttons.
	 *
	 * For a dialog that has to be answered rather than escaped — an unsaved-changes
	 * prompt, a licence acceptance. Use it rarely and never for convenience: a
	 * dialog that cannot be dismissed by the means every other dialog can is
	 * something users have to be taught, and they will try `Esc` first regardless.
	 *
	 * The × is still shown unless `isCloseButtonHidden` is also set, because a
	 * dialog with no visible way out is a trap.
	 */
	isDismissDisabled?: boolean

	/** Hides the × in the header. */
	isCloseButtonHidden?: boolean

	/**
	 * Drops the body's padding so the content reaches the dialog's edges.
	 *
	 * For content that draws its own frame and looks wrong inset in a second one —
	 * a `DataGrid`, a chart, a full-bleed image.
	 */
	isBodyFlush?: boolean

	className?: string
}

/** Material's close glyph. Inline, so it takes the button's `currentColor`. */
function CloseIcon() {
	return (
		<svg viewBox="0 -960 960 960" aria-hidden="true" focusable="false">
			<path d="M256-200l-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
		</svg>
	)
}

/**
 * A modal dialog holding whatever you put in it.
 *
 * ```tsx
 * const [isOpen, setIsOpen] = useState(false)
 *
 * <Button onClick={() => setIsOpen(true)}>Delete</Button>
 *
 * <Modal
 *     isOpen={isOpen}
 *     onClose={() => setIsOpen(false)}
 *     title="Delete purchase order 4500001827?"
 *     description="The order and all six of its items are removed. This cannot be undone."
 *     size="small"
 *     footer={
 *         <>
 *             <Button variant="transparent" onClick={() => setIsOpen(false)}>Cancel</Button>
 *             <Button variant="negative" onClick={remove}>Delete</Button>
 *         </>
 *     }
 * >
 *     <p>Any goods receipts already posted against it are left in place.</p>
 * </Modal>
 * ```
 *
 * -----------------------------------------------------------------------------
 * Built on the real `<dialog>`
 * -----------------------------------------------------------------------------
 * `showModal()` does the hard parts, correctly, for free:
 *
 * - **Focus is trapped** inside the dialog, and restored to whatever was focused
 *   when it closes.
 * - **Everything behind it is inert.** Not `aria-hidden`, not `pointer-events:
 *   none` — genuinely unreachable by pointer, keyboard and screen reader.
 * - **It renders in the top layer**, above every stacking context on the page.
 *   No portal, no `z-index` arms race with a sticky header.
 * - **`Esc` is wired up**, arriving here as the `cancel` event.
 *
 * Hand-rolling that list is how modals become the least accessible thing on a
 * screen. The one piece the browser does *not* do is stop the page behind from
 * scrolling; that is a CSS lock in `Modal.css`.
 *
 * -----------------------------------------------------------------------------
 * Focus on open
 * -----------------------------------------------------------------------------
 * The browser focuses the first thing in the dialog, which for a dialog with a ×
 * in its header is the ×. That is safe but rarely useful. Put `autoFocus` on the
 * control the user is meant to start with and it wins:
 *
 * ```tsx
 * <TextInput label="Reason" autoFocus />
 * ```
 *
 * Do not autofocus a destructive button. A dialog that deletes something on one
 * press of `Enter` is a data-loss bug with a confirmation step bolted on.
 */
function Modal({
	isOpen,
	onClose,
	title,
	description,
	children,
	footer,
	size = 'medium',
	isDismissDisabled,
	isCloseButtonHidden,
	isBodyFlush,
	className,
}: ModalProps) {
	const dialogRef = useRef<HTMLDialogElement>(null)

	/**
	 * Whether the press that is currently in progress started on the backdrop.
	 *
	 * Needed because a `click` on the backdrop cannot be trusted on its own. Press
	 * inside the dialog, drag out — selecting text in a paragraph, overshooting a
	 * slider — and release over the backdrop, and the browser reports a click
	 * whose target is the dialog. Closing on that throws away whatever the user
	 * was doing because they moved the mouse a few pixels too far.
	 *
	 * A ref rather than state: nothing rendered depends on it, and it has to be
	 * readable in the same gesture it was written in.
	 */
	const isBackdropPressRef = useRef(false)

	const titleId = useId()
	const descriptionId = useId()

	/**
	 * Drives the real dialog from the `isOpen` prop.
	 *
	 * The `dialog.open` checks are not defensive padding. `showModal()` on an
	 * already-open dialog throws, and `close()` on a closed one fires a spurious
	 * `close` event — either of which turns a harmless re-render into a bug.
	 */
	useEffect(() => {
		const dialog = dialogRef.current

		if (!dialog) {
			return
		}

		if (isOpen && !dialog.open) {
			dialog.showModal()
		} else if (!isOpen && dialog.open) {
			dialog.close()
		}
	}, [isOpen])

	const handlePointerDown = (event: PointerEvent<HTMLDialogElement>) => {
		/* The dialog element itself is only ever hit through its backdrop: its own
		 * box is filled edge to edge by the frame below, and `padding: 0` in the
		 * stylesheet leaves no border of dialog for a press to land on. */
		isBackdropPressRef.current = event.target === dialogRef.current
	}

	const handleClick = (event: MouseEvent<HTMLDialogElement>) => {
		const wasBackdropPress = isBackdropPressRef.current

		isBackdropPressRef.current = false

		if (isDismissDisabled || !wasBackdropPress) {
			return
		}

		/* Both ends of the gesture on the backdrop. Anything else — including a
		 * drag that merely finished there — is not a dismissal. */
		if (event.target === dialogRef.current) {
			onClose()
		}
	}

	return (
		<dialog
			ref={dialogRef}
			className={classNames('modal', `modal-${size}`, className)}
			aria-labelledby={titleId}
			aria-describedby={description ? descriptionId : undefined}
			/* `cancel` is Esc. Always prevented, so the dialog cannot close behind
			 * React's back and leave `isOpen` saying it is still open — the prop is
			 * the single source of truth, and `onClose` is how it gets changed. */
			onCancel={event => {
				event.preventDefault()

				if (!isDismissDisabled) {
					onClose()
				}
			}}
			/* A safety net for a close this component did not ask for: a
			 * `<form method="dialog">` inside the content, or `dialog.close()` from
			 * somewhere else. Without it the element would be shut while `isOpen`
			 * still said otherwise, and the next open would be a no-op. */
			onClose={() => {
				if (isOpen) {
					onClose()
				}
			}}
			onPointerDown={handlePointerDown}
			onClick={handleClick}
		>
			{/* Nothing is rendered while closed — see the note on `children`. The
			  * <dialog> itself stays mounted, because `showModal()` needs an element
			  * to be called on. */}
			{isOpen && (
				/* The frame fills the dialog, which is what makes "the press landed
				 * on the dialog element" mean "the press landed on the backdrop". */
				<div className="modal-frame">
					<header className="modal-header">
						<div className="modal-heading">
							{/* h2, not h1: a dialog opens over a screen that already has
							  * an h1, and two of those leaves the document outline
							  * claiming there are two pages. */}
							<h2 className="modal-title" id={titleId}>
								{title}
							</h2>

							{description && (
								<p className="modal-description" id={descriptionId}>
									{description}
								</p>
							)}
						</div>

						{!isCloseButtonHidden && (
							<button
								type="button"
								className="modal-close"
								/* The glyph is a shape, not a word. Without this the
								 * button is announced as "button" and nothing else. */
								aria-label="Close"
								onClick={onClose}
							>
								<CloseIcon />
							</button>
						)}
					</header>

					{/* The scrolling part. Only this scrolls, so the title stays
					  * readable and the actions stay reachable however long the
					  * content is — the failure mode otherwise is a dialog whose Save
					  * button is somewhere below the bottom of the screen. */}
					<div className={isBodyFlush ? 'modal-body modal-body-flush' : 'modal-body'}>{children}</div>

					{footer && <footer className="modal-footer">{footer}</footer>}
				</div>
			)}
		</dialog>
	)
}

export default Modal
