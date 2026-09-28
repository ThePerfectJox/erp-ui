/**
 * The form folder's pure layer: no React, no DOM, no state.
 *
 * - `types` — the vocabulary every control shares, plus the three prop contracts
 *   `useFormField` produces and `FormField` consumes.
 * - `fieldProps` — splitting shared props from native ones, and resolving
 *   `readOnly` for the controls HTML does not support it on.
 * - `comboBoxMatching` — filtering and wrapping index search for the combobox.
 * - `fileSize` — byte counts as text.
 *
 * Everything here is a function of its arguments, which makes it the part worth
 * checking first when a control misbehaves: if the logic is right, the problem is
 * in the wiring above it.
 */

export * from './comboBoxMatching'
export * from './fieldProps'
export * from './fileSize'
export * from './types'
