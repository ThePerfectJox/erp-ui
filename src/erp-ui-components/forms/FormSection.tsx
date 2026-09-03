// Groups fields under a title and optional description. No layout opinion
// beyond spacing between the heading and the fields — nest a FormRow inside
// if you want some fields side by side.

import type { ReactNode } from "react";
import "./index.css";

export interface FormSectionProps {
	title: string;
	description?: string;
	children: ReactNode;
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
