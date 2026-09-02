/**
 * erp-ui-components/forms/RadioGroup.tsx
 *
 * A native <fieldset> of radio buttons sharing one `name` — the fieldset is
 * what gives the group its border (styled in ./index.css instead of left at
 * the browser default), with an optional <legend> caption. Each <input> is
 * wrapped in its own <label>, so no ids/htmlFor bookkeeping is needed for the
 * label association. `disabled` on the fieldset natively disables every
 * radio inside it.
 */

import type { ChangeEventHandler, ComponentPropsWithoutRef } from "react";
import { mergeClassNames, type FormOption } from "./formsUtils";
import "./index.css";

export interface RadioGroupProps extends Omit<ComponentPropsWithoutRef<"fieldset">, "onChange"> {
	name: string;
	options: FormOption[];
	legend?: string;
	defaultValue?: string;
	onChange?: ChangeEventHandler<HTMLInputElement>;
}

export default function RadioGroup({
	name,
	options,
	legend,
	defaultValue,
	onChange,
	className,
	...fieldsetProps
}: RadioGroupProps) {
	return (
		<fieldset className={mergeClassNames("form-option-group", className)} {...fieldsetProps}>
			{legend && <legend className="form-group-legend">{legend}</legend>}
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
