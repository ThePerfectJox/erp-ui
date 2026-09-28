/**
 * The building blocks the controls are made of.
 *
 * Two of these are the reason the controls stay short and consistent:
 *
 * - `FormField` — the label, required marker, hint and message around any control.
 *   No control renders its own; they all hand that job here, which is why a hint
 *   sits in the same place on every field in the app.
 * - `FormControlShell` — fixed text inside the field box beside the value.
 *
 * The other three exist because two or more controls were doing the same thing
 * separately:
 *
 * - `ChoiceList` — the option list shared by `RadioGroup` and `CheckboxGroup`.
 * - `ReadOnlySubmitValue` — keeps a read-only checkbox's value in the submitted
 *   form, for `Checkbox` and `Switch`.
 * - `HighlightedLabel` — the matched run of characters in a combobox row.
 *
 * `FormField` and `FormControlShell` are re-exported from the folder's public
 * barrel, because composing a control this library does not have is a real use
 * case. The other three are internal: they are shaped around their two callers
 * rather than around being generally useful, and exporting them would freeze that
 * shape.
 */

export { default as ChoiceList } from './ChoiceList'
export { default as FormControlShell } from './FormControlShell'
export { default as FormField } from './FormField'
export type { FormFieldVariant } from './FormField'
export { default as HighlightedLabel } from './HighlightedLabel'
export { default as ReadOnlySubmitValue } from './ReadOnlySubmitValue'
