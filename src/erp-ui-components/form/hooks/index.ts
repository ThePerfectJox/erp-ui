/**
 * The form folder's behaviour.
 *
 * Two hooks, at two very different scales, and the contrast is the point:
 *
 * - `useFormField` is the *shared* one. Every control calls it, and that is why
 *   they all wire up their label, hint, message and ARIA identically — there is
 *   one implementation to get right rather than twelve to keep in step.
 * - `useComboBox` belongs to one control. It is here because that control's
 *   behaviour is large enough to be worth reading on its own, not because anything
 *   else uses it.
 *
 * A control whose behaviour fits in its render function keeps it there. Extracting
 * a hook per component on principle would just spread ten-line components across
 * twenty files.
 */

export { useComboBox } from './useComboBox'
export type { ComboBoxState } from './useComboBox'

export { useFormField } from './useFormField'
export type { UseFormFieldResult } from './useFormField'
