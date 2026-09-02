/**
 * erp-ui-components/forms/FormSection.tsx
 *
 * Groups related fields under a heading — a title, an optional description,
 * and whatever field components you nest inside it. No layout opinion beyond
 * spacing between the heading and the fields; nest a FormRow inside it if you
 * want some of those fields side by side.
 */

import type { ReactElement } from "react";
import "./index.css";

export interface FormSectionProps {
	title: string;
	description?: string;
	children: ReactElement | ReactElement[];
}

export default function FormSection({ title, description, children }: FormSectionProps) {
	return (
		<section className="form-section">
			<div className="form-section-heading">
				<h3 className="form-section-title">{title}</h3>
				{description && <p className="form-section-description">{description}</p>}
			</div>
			<div className="form-section-body">{children}</div>
		</section>
	);
}
