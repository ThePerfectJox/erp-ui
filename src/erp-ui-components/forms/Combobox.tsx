// A dropdown with a text input — the native way: a text input wired to a
// <datalist> via the `list` attribute. Typing filters the suggestions and
// picking one fills the input, both handled by the browser.

import { useId } from "react";
import type { ChangeEventHandler } from "react";
import FormFieldShell from "./FormFieldShell";
import { normalizeComboboxOptions, type FormOption } from "./formsUtils";
import "./index.css";

export interface ComboboxProps {
	id?: string;
	name: string;
	label: string;
	hint?: string;
	placeholder?: string;
	options: (string | FormOption)[];
	defaultValue?: string;
	value?: string;
	onChange?: ChangeEventHandler<HTMLInputElement>;
	required?: boolean;
	disabled?: boolean;
}

export default function Combobox({ id, name, label, hint, options, ...props }: ComboboxProps) {
	const uniqueId = useId();
	const finalId = id ?? uniqueId;
	const listId = `${finalId}-options`;
	const normalizedOptions = normalizeComboboxOptions(options);

	return (
		<FormFieldShell id={finalId} label={label} hint={hint}>
			<input id={finalId} name={name} className="form-input" {...props} type="text" list={listId} />
			<datalist id={listId}>
				{normalizedOptions.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</datalist>
		</FormFieldShell>
	);
}
