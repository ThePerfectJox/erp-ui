// A native <fieldset> of radio buttons sharing one `name`. The fieldset's
// own border/<legend> is the "label" for the group — no htmlFor needed.

import type { ChangeEventHandler } from "react";
import type { FormOption } from "./formsUtils";
import "./index.css";

export interface RadioGroupProps {
	id?: string;
	name: string;
	label: string;
	hint?: string;
	options: FormOption[];
	defaultValue?: string;
	onChange?: ChangeEventHandler<HTMLInputElement>;
	disabled?: boolean;
}

export default function RadioGroup({ id, name, label, hint, options, defaultValue, onChange, disabled }: RadioGroupProps) {
	return (
		<fieldset id={id} className="form-option-group" disabled={disabled}>
			<legend className="form-group-legend">{label}</legend>
			{hint && <p className="form-hint">{hint}</p>}
			{options.map((option) => (
				<label key={option.value} className="form-option">
					<input
						type="radio"
						name={name}
						value={option.value}
						defaultChecked={option.value === defaultValue}
						onChange={onChange}
						className="form-option-input"
					/>
					<span>{option.label}</span>
				</label>
			))}
		</fieldset>
	);
}
