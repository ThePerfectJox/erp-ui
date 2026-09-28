import type { ReactNode } from 'react'

interface FormRowProps {
	/**
	 * How many fields sit side by side on a wide screen. Defaults to 2.
	 *
	 * Three is about the limit for fields with real labels; past that the labels
	 * wrap and the row stops being a row. The columns collapse to one below
	 * 768px whatever this says.
	 */
	columns?: 1 | 2 | 3

	children?: ReactNode
}

/**
 * Puts fields side by side.
 *
 * ```tsx
 * <FormRow>
 *     <TextInput label="Purchase order" />
 *     <DateInput label="Document date" />
 * </FormRow>
 *
 * <FormRow columns={3}>
 *     <NumberInput label="Quantity" unit="EA" />
 *     <NumberInput label="Net price" prefix="€" />
 *     <Select label="Unit" options={units} />
 * </FormRow>
 * ```
 *
 * Group fields that are read together — quantity with its unit, city with its
 * postal code. Two unrelated fields on one line just look tidier while making
 * the form harder to fill in, because the eye has to decide where to go next
 * instead of simply going down.
 *
 * A CSS grid with equal columns, so the fields line up regardless of how long
 * their labels are. Fields that should not share width evenly are better off in
 * separate rows than fought with overrides.
 */
function FormRow({ columns = 2, children }: FormRowProps) {
	return <div className={`form-row form-row-${columns}`}>{children}</div>
}

export default FormRow
