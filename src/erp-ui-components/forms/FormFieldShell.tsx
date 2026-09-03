// Internal — not exported from index.ts. The label+control+hint stack every
// labeled field (TextInput, TextArea, NumberInput, DateInput, Combobox)
// renders itself; RadioGroup/CheckboxGroup don't use this, their <fieldset>
// + <legend> is its own native label pairing.

import type { ReactNode } from "react";

interface FormFieldShellProps {
	id: string;
	label: string;
	hint?: string;
	children: ReactNode;
}

export default function FormFieldShell({ id, label, hint, children }: FormFieldShellProps) {
	return (
		<div className="form-field">
			<label htmlFor={id} className="form-label">
				{label}
			</label>
			{children}
			{hint && <p className="form-hint">{hint}</p>}
		</div>
	);
}
