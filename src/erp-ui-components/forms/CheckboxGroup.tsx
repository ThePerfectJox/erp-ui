// A native <fieldset> of checkboxes sharing one `name` — like RadioGroup,
// except any number can be checked. The repeated `name` collects into an
// array on submit (see formsUtils.formDataToObject) instead of the last
// value winning.

import type { ChangeEventHandler } from "react";
import type { FormOption } from "./formsUtils";
import "./index.css";

export interface CheckboxGroupProps {
	id?: string;
	name: string;
	label: string;
	hint?: string;
	options: FormOption[];
	defaultValues?: string[];
	onChange?: ChangeEventHandler<HTMLInputElement>;
	disabled?: boolean;
}

export default function CheckboxGroup({ id, name, label, hint, options, defaultValues, onChange, disabled }: CheckboxGroupProps) {
	return (
		<fieldset id={id} className="form-option-group" disabled={disabled}>
			<legend className="form-group-legend">{label}</legend>
			{hint && <p className="form-hint">{hint}</p>}
			{options.map((option) => (
				<label key={option.value} className="form-option">
					<input
						type="checkbox"
						name={name}
						value={option.value}
						defaultChecked={defaultValues?.includes(option.value)}
						onChange={onChange}
						className="form-option-input"
					/>
					<span>{option.label}</span>
				</label>
			))}
		</fieldset>
	);
}
