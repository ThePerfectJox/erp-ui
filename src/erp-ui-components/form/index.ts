/**
 * Form components.
 *
 * ```tsx
 * import { Button, Form, FormRow, FormSection, TextInput } from './erp-ui-components/form'
 * ```
 *
 * Every control takes the same shared props — `label`, `hint`, `valueState`,
 * `valueStateMessage`, `isRequired`, `isDisabled`, `isReadOnly` — so learning
 * one teaches you all of them. See `FieldTypes.ts` for what each one means.
 *
 * Importing anything from here pulls in `Form.css`, which carries the styling
 * for the whole set.
 */

import './Form.css'

/* --- Controls ------------------------------------------------------------- */
export { default as Button } from './Button'
export { default as Checkbox } from './Checkbox'
export { default as CheckboxGroup } from './CheckboxGroup'
export { default as ComboBox } from './ComboBox'
export { default as DateInput } from './DateInput'
export { default as FileInput } from './FileInput'
export { default as NumberInput } from './NumberInput'
export { default as RadioGroup } from './RadioGroup'
export { default as Select } from './Select'
export { default as Switch } from './Switch'
export { default as TextArea } from './TextArea'
export { default as TextInput } from './TextInput'

/* --- Layout and messaging ------------------------------------------------- */
export { default as Form } from './Form'
export { default as FormActions } from './FormActions'
export { default as FormRow } from './FormRow'
export { default as FormSection } from './FormSection'
export { default as MessageStrip } from './MessageStrip'

/* --- Building blocks -----------------------------------------------------
 * For composing a control this folder does not have — a value-help lookup, a
 * currency pair — so it comes out looking like everything else. */
export { default as FormField } from './FormField'
export { default as FormControlShell } from './FormControlShell'
export { splitFieldProps, useFormField } from './useFormField'

/* --- Types ----------------------------------------------------------------
 * `export type` rather than `export`, as `verbatimModuleSyntax` requires: it
 * tells the bundler these vanish at build time and there is no runtime import
 * to keep. */
export type {
	FieldAdornment,
	FieldBaseProps,
	FieldDensity,
	FieldLabelPlacement,
	FieldOption,
	FieldValueState,
	PassthroughInputProps,
	PassthroughSelectProps,
	PassthroughTextAreaProps,
} from './FieldTypes'

export type { ButtonLogoPosition, ButtonProps, ButtonVariant } from './Button'
export type { ComboBoxFilter } from './ComboBox'
export type { ChoiceOrientation } from './RadioGroup'
export type { DateInputType } from './DateInput'
export type { FormActionsAlignment } from './FormActions'
export type { FormFieldVariant } from './FormField'
export type { TextInputType } from './TextInput'
export type {
	FormControlProps,
	FormFieldChromeProps,
	FormGroupProps,
	UseFormFieldResult,
} from './useFormField'
