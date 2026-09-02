/**
 * erp-ui-components/forms/CheckboxGroup.tsx
 *
 * A native <fieldset> of checkboxes sharing one `name` — same shape as
 * RadioGroup, except any number of them can be checked at once. Submitted
 * through a <form> (or formsUtils.getFormValues), the repeated `name`
 * collects into an array rather than the last value winning.
 */

import type { ChangeEventHandler, ComponentPropsWithoutRef } from "react";
import { mergeClassNames, type FormOption } from "./formsUtils";
import "./index.css";

export interface CheckboxGroupProps extends Omit<ComponentPropsWithoutRef<"fieldset">, "onChange"> {
	name: string;
	options: FormOption[];
	legend?: string;
	defaultValues?: string[];
	onChange?: ChangeEventHandler<HTMLInputElement>;
}

export default function CheckboxGroup({
	name,
	options,
	legend,
	defaultValues,
	onChange,
	className,
	...fieldsetProps
}: CheckboxGroupProps) {
	return (
		<fieldset className={mergeClassNames("form-option-group", className)} {...fieldsetProps}>
			{legend && <legend className="form-group-legend">{legend}</legend>}
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
