import type { FormHTMLAttributes, ReactNode } from 'react'
import { classNames } from '../../shared/classNames'
import type { FieldDensity, FieldLabelPlacement } from '../core/types'

interface FormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, 'className'> {
	/**
	 * Where labels sit, for every field inside. Inherited through CSS, so
	 * setting it here is enough — no field has to be told individually, and a
	 * field can still override it with its own `labelPlacement`.
	 *
	 * `"above"` by default. `"beside"` gives the dense two-column look of a
	 * classic ERP maintenance screen and drops back to `"above"` under 768px on
	 * its own.
	 */
	labelPlacement?: FieldLabelPlacement

	/**
	 * `"cozy"` (36px controls) by default; `"compact"` (26px) for dense screens.
	 *
	 * Implemented as a token override on this element — `--control-height` is
	 * reassigned for the subtree — so every control sized from it follows without
	 * being told. That is also why a `<Button>` inside a compact form shrinks
	 * without needing its own `density` prop.
	 */
	density?: FieldDensity

	/**
	 * Caps the width of the fields. Long single-line inputs are harder to scan,
	 * not easier, and a name field stretched across a 27-inch monitor looks
	 * broken. Off for `"beside"` layouts, which manage their own width.
	 */
	isNarrow?: boolean

	className?: string
	children?: ReactNode
}

/**
 * The form element, and the one place a screen's field layout is decided.
 *
 * ```tsx
 * <Form labelPlacement="beside" onSubmit={handleSubmit}>
 *     <FormSection title="Header">
 *         <FormRow>
 *             <TextInput label="Purchase order" />
 *             <DateInput label="Document date" />
 *         </FormRow>
 *     </FormSection>
 *
 *     <FormActions>
 *         <Button variant="emphasized" type="submit">Save</Button>
 *         <Button>Cancel</Button>
 *     </FormActions>
 * </Form>
 * ```
 *
 * `noValidate` is worth a thought. Left off, the browser blocks submission and
 * shows its own bubble for a missing required field, which is free and works
 * without JavaScript. Set it and you own every message — which is the right
 * call once you are showing `valueState` yourself, because otherwise the user
 * gets told twice, in two different visual languages.
 */
function Form({ labelPlacement = 'above', density = 'cozy', isNarrow, className, children, ...nativeProps }: FormProps) {
	return (
		<form
			{...nativeProps}
			className={classNames(
				'form',
				`form-labels-${labelPlacement}`,
				`form-density-${density}`,
				isNarrow && 'form-narrow',
				className
			)}
		>
			{children}
		</form>
	)
}

export default Form
