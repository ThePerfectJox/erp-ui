// Project-wide behavioral defaults for erp-ui-components, so call sites don't
// each decide their own policy via props.

export const erpUiSettings = {
	modal: {
		/** Dismiss the modal on a click outside the dialog surface. */
		closeOnBackdropClick: true,
		/** Dismiss the modal on the Escape key. */
		closeOnEsc: true,
	},
} as const;
