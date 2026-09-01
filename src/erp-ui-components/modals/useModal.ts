import { useCallback, useMemo, useState } from "react";

/**
 * Minimal open/close state for a <Modal>. Keeps the three one-line callbacks
 * out of every screen that shows a dialog.
 *
 *   const dialog = useModal();
 *
 *   <button onClick={dialog.onOpen}>Edit</button>
 *   <Modal open={dialog.open} onClose={dialog.onClose}> … </Modal>
 */
export function useModal(initialOpen = false) {
	const [open, setOpen] = useState(initialOpen);

	const onOpen = useCallback(() => setOpen(true), []);
	const onClose = useCallback(() => setOpen(false), []);
	const toggle = useCallback(() => setOpen((value) => !value), []);

	return useMemo(
		() => ({ open, onOpen, onClose, toggle }),
		[open, onOpen, onClose, toggle],
	);
}
