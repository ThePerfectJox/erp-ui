/**
 * erp-ui-components/erp-ui-settings.ts
 *
 * Project-wide behavioral defaults for erp-ui-components. Things like "does a
 * backdrop click dismiss the modal?" are a house policy, not a decision each
 * call site should make — threading them through as a prop on every
 * `<Modal closeOnEsc={false} closeOnBackdropClick={false}>` just gives every
 * screen a chance to disagree with the others for no reason. Change the
 * default here once instead of hunting down every call site.
 */

export const erpUiSettings = {
	modal: {
		/** Dismiss the modal on a click outside the dialog surface. */
		closeOnBackdropClick: true,
		/** Dismiss the modal on the Escape key. */
		closeOnEsc: true,
	},
} as const;
