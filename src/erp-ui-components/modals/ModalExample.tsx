import { Modal, useModal } from "./index";

/**
 * End-to-end example — mirrors layouts/LayoutExample.tsx. Not exported from the
 * barrel; render it from a route/screen to try the modal by hand.
 *
 * The modal is just a shell: the heading, copy and action buttons are all
 * `children` here, and the buttons call `dialog.onClose` directly.
 */
export default function ModalExample() {
	const dialog = useModal();

	return (
		<>
			<button type="button" onClick={dialog.onOpen}>
				Open modal
			</button>

			<Modal
				open={dialog.open}
				onClose={dialog.onClose}
				ariaLabelledBy="delete-item-title"
			>
				<h2 id="delete-item-title">Delete item</h2>
				<p>This action cannot be undone. Are you sure you want to continue?</p>

				<div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
					<button type="button" onClick={dialog.onClose}>
						Cancel
					</button>
					<button type="button" onClick={dialog.onClose}>
						Delete
					</button>
				</div>
			</Modal>
		</>
	);
}
