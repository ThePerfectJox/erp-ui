import { Modal, useModal } from "./index";

/**
 * The thing being shown. An ordinary component, unaware it's inside a modal —
 * it just happens to be passed to <Modal> as `children`. Because sizing is no
 * longer the container's job (see index.css), this component sets its own
 * `max-width`, same as it would if it were rendered anywhere else on the page.
 */
function DeleteItemDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
	return (
		<div style={{ maxWidth: "34rem" }}>
			<h2 id="delete-item-title">Delete item</h2>
			<p>This action cannot be undone. Are you sure you want to continue?</p>

			{/* The destructive action is the filled red one; Cancel stays a quiet
			    outlined button, so the two can never be confused mid-click. */}
			<div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
				<button type="button" onClick={onCancel}>
					Cancel
				</button>
				<button type="button" className="button-danger" onClick={onConfirm}>
					Delete
				</button>
			</div>
		</div>
	);
}

/**
 * End-to-end example — mirrors layouts/LayoutExample.tsx. Not exported from the
 * barrel; render it from a route/screen to try the modal by hand.
 *
 * <Modal> only decides whether DeleteItemDialog is shown; DeleteItemDialog
 * owns everything about what's shown, including its own width.
 */
export default function ModalExample() {
	const dialog = useModal();

	return (
		<>
			<button type="button" className="button-primary" onClick={dialog.onOpen}>
				Open modal
			</button>

			<Modal
				open={dialog.open}
				onClose={dialog.onClose}
				ariaLabelledBy="delete-item-title"
			>
				<DeleteItemDialog onCancel={dialog.onClose} onConfirm={dialog.onClose} />
			</Modal>
		</>
	);
}
