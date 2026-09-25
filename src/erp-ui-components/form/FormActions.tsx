import type { ReactNode } from 'react'

/**
 * Which end of the bar the buttons sit at.
 *
 * `"end"` (the right) is the default and matches SAP's footer bar: the reading
 * order finishes at the confirming action. Use `"start"` for a form embedded in
 * a narrow panel, where a right-aligned button ends up far from the fields it
 * applies to.
 */
export type FormActionsAlignment = 'start' | 'end' | 'space-between'

interface FormActionsProps {
	/** Defaults to `"end"`. */
	alignment?: FormActionsAlignment

	/**
	 * Pins the bar to the bottom of the viewport while the form scrolls under
	 * it. For long maintenance screens, so Save is reachable without scrolling
	 * to the end of a hundred fields.
	 */
	isSticky?: boolean

	children?: ReactNode
}

/**
 * The footer bar holding a form's buttons.
 *
 * ```tsx
 * <FormActions>
 *     <Button variant="transparent">Cancel</Button>
 *     <Button type="reset">Reset</Button>
 *     <Button variant="emphasized" type="submit">Save</Button>
 * </FormActions>
 * ```
 *
 * Write the buttons in the order they should appear, with the confirming action
 * last so it lands rightmost — the same place every OS dialog puts it. The bar
 * is never reversed with `row-reverse`: that would make the tab order run
 * right-to-left while the buttons read left-to-right, which is the focus-order
 * trap in WCAG 2.4.3.
 *
 * One emphasized button per bar. A second one means the screen has not decided
 * what it is for, and the user has to make that decision instead.
 */
function FormActions({ alignment = 'end', isSticky, children }: FormActionsProps) {
	const classNames = ['form-actions', `form-actions-${alignment}`]

	if (isSticky) {
		classNames.push('form-actions-sticky')
	}

	return <div className={classNames.join(' ')}>{children}</div>
}

export default FormActions
