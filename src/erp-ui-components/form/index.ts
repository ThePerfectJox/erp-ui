/**
 * Form components.
 *
 * ```tsx
 * import { Button, Form, FormRow, FormSection, TextInput } from './erp-ui-components/form'
 * ```
 *
 * Every control takes the same shared props — `label`, `hint`, `valueState`,
 * `valueStateMessage`, `isRequired`, `isDisabled`, `isReadOnly` — so learning
 * one teaches you all of them. See `core/types.ts` for what each one means.
 *
 * -----------------------------------------------------------------------------
 * How the folder is laid out
 * -----------------------------------------------------------------------------
 * Five layers, and every dependency points inward:
 *
 * | Folder | Holds | React? |
 * | --- | --- | --- |
 * | `core/` | the shared vocabulary, prop plumbing, combobox matching, byte formatting | no |
 * | `hooks/` | `useFormField`, and `useComboBox` for the one control big enough to need it | yes |
 * | `parts/` | the label/hint/message shell and the pieces two or more controls share | yes |
 * | `controls/` | the twelve things you put on a screen | yes |
 * | `structure/` | the form, its sections and rows, the action bar, the message strip | yes |
 * | `styles/` | five stylesheets, split by the same concerns | — |
 *
 * The one place to start reading is `hooks/useFormField.ts` together with
 * `parts/FormField.tsx`. Between them they are why every field in the app wires up
 * its label, hint, message and ARIA identically, and why each control file is short
 * enough to hold the part that is actually specific to it.
 *
 * This barrel imports `styles/index.css`, so importing anything from here brings
 * the styling with it. It needs `../styles/index.css` — the theme — to have been
 * loaded first; see that file.
 */

import './styles/index.css'

/* --- Controls ------------------------------------------------------------- */
export * from './controls'

/* --- Structure and messaging ---------------------------------------------- */
export * from './structure'

/* --- Building blocks -----------------------------------------------------
 * For composing a control this folder does not have — a value-help lookup, a
 * currency pair — so it comes out looking like everything else.
 *
 * `FormField` plus `useFormField` is the pair that matters; `splitFieldProps`
 * separates your own props from the ones the DOM node should receive.
 *
 * `parts/ChoiceList`, `parts/ReadOnlySubmitValue` and `parts/HighlightedLabel` are
 * deliberately not exported. They are shaped around their two callers each rather
 * than around being generally useful, and exporting them would freeze that shape. */
export { default as FormField } from './parts/FormField'
export type { FormFieldVariant } from './parts/FormField'
export { default as FormControlShell } from './parts/FormControlShell'

export { useFormField } from './hooks/useFormField'
export type { UseFormFieldResult } from './hooks/useFormField'

export { extractReadOnly, splitFieldProps } from './core/fieldProps'
export type { NonNativeReadOnlyProps } from './core/fieldProps'

export { formatFileSize } from './core/fileSize'
export { findMatchRange, findSelectableIndex, matchLabelOrValue } from './core/comboBoxMatching'
export type { ComboBoxFilter } from './core/comboBoxMatching'

/* --- Types ----------------------------------------------------------------
 * `export type` rather than `export`, as `verbatimModuleSyntax` requires: it
 * tells the bundler these vanish at build time and there is no runtime import
 * to keep. */
export type {
	ChoiceOrientation,
	FieldAdornment,
	FieldBaseProps,
	FieldDensity,
	FieldLabelPlacement,
	FieldOption,
	FieldValueState,
	FormControlProps,
	FormFieldChromeProps,
	FormGroupProps,
	PassthroughInputProps,
	PassthroughSelectProps,
	PassthroughTextAreaProps,
} from './core/types'
