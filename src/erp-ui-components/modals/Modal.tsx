/**
 * erp-ui-components/modals/Modal.tsx
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

import { erpUiSettings } from "../erp-ui-settings";
import "./index.css";

const { closeOnBackdropClick, closeOnEsc } = erpUiSettings.modal;

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
	open: boolean;
	onClose: () => void;
	children: ReactNode;
	ariaLabel?: string;
	ariaLabelledBy?: string;
}

export default function Modal({
	open,
	onClose,
	children,
	ariaLabel,
	ariaLabelledBy,
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
	}, [open, onClose]);

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
		[onClose],
	);

	// Every hook has run; safe to bail out now that the modal is hidden.
	if (!open) return null;

	return createPortal(
		<div className="modal-backdrop" onMouseDown={handleBackdropMouseDown}>
			<div
				ref={dialogRef}
				className="modal"
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
		document.body,
	);
}
