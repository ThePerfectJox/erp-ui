// Plain logic for the forms module — no React, no JSX.

export type FormValues = Record<string, FormDataEntryValue | FormDataEntryValue[]>;

/** Repeated field names (a checkbox group) collect into an array instead of overwriting each other. */
export function formDataToObject(formData: FormData): FormValues {
	const values: FormValues = {};
	for (const [key, value] of formData.entries()) {
		const existing = values[key];
		if (existing === undefined) {
			values[key] = value;
		} else if (Array.isArray(existing)) {
			existing.push(value);
		} else {
			values[key] = [existing, value];
		}
	}
	return values;
}

/** What SubmitButton hands back — also usable directly from your own <form onSubmit>. */
export function getFormValues(form: HTMLFormElement): FormValues {
	return formDataToObject(new FormData(form));
}

/** Shared by RadioGroup, CheckboxGroup and Combobox — one option shape for the whole module. */
export interface FormOption {
	label: string;
	value: string;
}

/** Combobox accepts a flat string list or `{ label, value }` pairs — a plain string becomes its own label. */
export function normalizeComboboxOptions(options: (string | FormOption)[]): FormOption[] {
	return options.map((option) => (typeof option === "string" ? { label: option, value: option } : option));
}
