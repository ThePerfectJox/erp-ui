/**
 * The frame a form is built in, rather than the things you type into.
 *
 * `Form`, `FormSection` and `FormRow` nest in that order and between them decide
 * every layout question a screen has: where labels sit, how dense the controls
 * are, and how many fields share a line. Nothing below them has to be told — it
 * is inherited through CSS, which is why a field never carries layout props.
 *
 * `FormActions` is the footer bar, and `MessageStrip` is form-level feedback: it
 * is here rather than with the controls because it describes the *form*, not a
 * value, and it is the counterpart to the per-field `valueState` rather than a
 * field in its own right.
 */

export { default as Form } from './Form'

export { default as FormActions } from './FormActions'
export type { FormActionsAlignment } from './FormActions'

export { default as FormRow } from './FormRow'
export { default as FormSection } from './FormSection'
export { default as MessageStrip } from './MessageStrip'
