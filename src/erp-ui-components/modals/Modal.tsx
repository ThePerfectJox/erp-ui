/**
 * erp-ui-components/modals/Modal.tsx
 *
 * An accessible, controlled dialog *shell*.
 *
 *  · "Controlled" — the parent owns the open/closed state and passes it in as
 *    `open`. The modal calls `onClose` to *request* dismissal but never flips
 *    the state itself, which keeps "are you sure?" guards trivial to add.
 *    `useModal()` (./useModal) covers the usual boilerplate.
 *
 *  · Rendered through a React *portal* into `document.body`, so the dialog and
 *    its backdrop escape the layout's stacking / overflow contexts (the fixed
 *    <header>, the scrolling <main>, …) and always sit above the whole page.
 *
 *  · Content is entirely yours — the modal renders only `children`. Header,
 *    footer, action buttons, a close (×) control: compose them in the parent
 *    and pass them in. Anything in `children` (a Cancel button wired to
 *    `onClose`, a form's submit handler, …) works normally.
 *
 *  · Accessibility: role="dialog" + aria-modal, focus is moved into the dialog
 *    on open and restored to the triggering element on close, Tab is trapped
 *    inside, and Escape / a backdrop click both dismiss. Give the dialog an
 *    accessible name with `ariaLabel`, or `ariaLabelledBy` pointing at the id
 *    of a heading you render inside `children`.
 *
 * Styling lives in ./index.css.
 */

import { useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type {
	KeyboardEvent as ReactKeyboardEvent,
	MouseEvent as ReactMouseEvent,
	ReactNode,
} from "react";

import "./index.css";

/** Selector for elements that can take keyboard focus — drives the focus trap. */
const FOCUSABLE_SELECTOR = [
	"a[href]",
	"button:not([disabled])",
	"input:not([disabled])",
	"select:not([disabled])",
	"textarea:not([disabled])",
	'[tabindex]:not([tabindex="-1"])',
].join(",");

export interface ModalProps {
	/** Whether the dialog is shown. The parent owns this (controlled component). */
	open: boolean;
	/**
	 * Called when the user asks to dismiss: Escape or a backdrop click. The
	 * parent must respond by setting `open` to false — the modal never closes
	 * itself. Wire your own Cancel / × control in `children` to this too.
	 */
	onClose: () => void;
	/** Everything inside the dialog — the parent owns the whole layout. */
	children: ReactNode;
	/** Accessible name for the dialog. */
	ariaLabel?: string;
	/** id of a heading rendered inside `children`, used as the accessible name. */
	ariaLabelledBy?: string;
	/** Width preset. Default "md". */
	size?: "sm" | "md" | "lg";
	/** Dismiss when the dimmed area outside the dialog is clicked. Default true. */
	closeOnBackdropClick?: boolean;
	/** Dismiss when Escape is pressed. Default true. */
	closeOnEsc?: boolean;
	/**
	 * Portal target. Defaults to `document.body`; override to mount the dialog
	 * inside a specific subtree (a themed root, tests, Shadow DOM …).
	 */
	container?: Element | DocumentFragment;
}

export default function Modal({
	open,
	onClose,
	children,
	ariaLabel,
	ariaLabelledBy,
	size = "md",
	closeOnBackdropClick = true,
	closeOnEsc = true,
	container,
}: ModalProps) {
	const dialogRef = useRef<HTMLDivElement>(null);
	// Whatever had focus before we opened, so focus can go back there on close.
	const previouslyFocused = useRef<HTMLElement | null>(null);

	// --- Escape to close ---------------------------------------------------
	useEffect(() => {
		if (!open || !closeOnEsc) return;
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKeyDown);
		return () => document.removeEventListener("keydown", onKeyDown);
	}, [open, closeOnEsc, onClose]);

	// --- Lock background scroll while open -------------------------------
	useEffect(() => {
		if (!open) return;
		const previousOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			document.body.style.overflow = previousOverflow;
		};
	}, [open]);

	// --- Move focus in on open, restore it on close --------------------
	useEffect(() => {
		if (!open) return;
		previouslyFocused.current = document.activeElement as HTMLElement | null;

		const dialog = dialogRef.current;
		const firstFocusable = dialog?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
		// Focus the first interactive control, or the dialog shell itself.
		(firstFocusable ?? dialog)?.focus();

		return () => {
			previouslyFocused.current?.focus();
		};
	}, [open]);

	// --- Focus trap: keep Tab cycling within the dialog --------------
	const handleKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
		if (event.key !== "Tab") return;
		const dialog = dialogRef.current;
		if (!dialog) return;

		const focusable = dialog.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
		if (focusable.length === 0) {
			// Nothing to move to — pin focus on the dialog shell.
			event.preventDefault();
			return;
		}

		const first = focusable[0];
		const last = focusable[focusable.length - 1];
		const active = document.activeElement;

		// Wrap around at either end.
		if (event.shiftKey && active === first) {
			event.preventDefault();
			last.focus();
		} else if (!event.shiftKey && active === last) {
			event.preventDefault();
			first.focus();
		}
	}, []);

	// --- Backdrop click -----------------------------------------------
	const handleBackdropMouseDown = useCallback(
		(event: ReactMouseEvent<HTMLDivElement>) => {
			// Only when the press both starts and ends on the backdrop itself —
			// `mousedown` + target check avoids closing on a drag that began
			// inside the dialog (e.g. selecting text) and released outside.
			if (closeOnBackdropClick && event.target === event.currentTarget) {
				onClose();
			}
		},
		[closeOnBackdropClick, onClose],
	);

	// Every hook has run; safe to bail out now that the modal is hidden.
	if (!open) return null;

	return createPortal(
		<div className="modal-backdrop" onMouseDown={handleBackdropMouseDown}>
			<div
				ref={dialogRef}
				className={`modal modal-${size}`}
				role="dialog"
				aria-modal="true"
				aria-label={ariaLabelledBy == null ? ariaLabel : undefined}
				aria-labelledby={ariaLabelledBy}
				tabIndex={-1}
				onKeyDown={handleKeyDown}
			>
				<div className="modal-body">{children}</div>
			</div>
		</div>,
		container ?? document.body,
	);
}
