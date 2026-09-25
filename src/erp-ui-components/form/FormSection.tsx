import type { ReactNode } from 'react'

interface FormSectionProps {
	/**
	 * The heading. A long form is only navigable if its groups are named —
	 * "Header", "Items", "Terms of payment" — and these become the landmarks a
	 * screen reader user tabs between.
	 */
	title: string

	/** One line under the heading, for a rule that applies to the whole group. */
	description?: string

	/**
	 * Renders the heading at a different level. The default is `"h3"`, which
	 * assumes the screen has an `<h1>` and the form sits under an `<h2>`.
	 * Adjust it so the page's headings stay in order with no levels skipped —
	 * that outline is how assistive tech navigates, and a jump from h1 to h3
	 * reads as a missing section.
	 */
	headingLevel?: 'h2' | 'h3' | 'h4'

	children?: ReactNode
}

/**
 * A titled group of fields.
 *
 * ```tsx
 * <FormSection title="Terms of payment" description="Agreed with the supplier at contract level.">
 *     <FormRow>
 *         <Select label="Payment terms" options={paymentTerms} />
 *         <NumberInput label="Discount (%)" unit="%" />
 *     </FormRow>
 * </FormSection>
 * ```
 *
 * A `<section>` with a heading rather than a `<fieldset>` with a `<legend>`:
 * fieldsets are for a set of controls answering one question, which is what
 * `<RadioGroup>` uses, and nesting those inside an outer fieldset makes screen
 * readers announce both captions on every field.
 */
function FormSection({ title, description, headingLevel = 'h3', children }: FormSectionProps) {
	const Heading = headingLevel

	return (
		<section className="form-section">
			<div className="form-section-header">
				<Heading className="form-section-title">{title}</Heading>
				{description && <p className="form-section-description">{description}</p>}
			</div>
			<div className="form-section-body">{children}</div>
		</section>
	)
}

export default FormSection
