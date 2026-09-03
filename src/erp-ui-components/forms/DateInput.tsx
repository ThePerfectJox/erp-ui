import { useId } from "react";
import type { ChangeEventHandler } from "react";
import FormFieldShell from "./FormFieldShell";
import "./index.css";

export interface DateInputProps {
	id?: string;
	name: string;
	label: string;
	hint?: string;
	placeholder?: string;
	defaultValue?: string;
	value?: string;
	onChange?: ChangeEventHandler<HTMLInputElement>;
	required?: boolean;
	disabled?: boolean;
}

export default function DateInput({ id, name, label, hint, ...props }: DateInputProps) {
	const uniqueId = useId();
	const finalId = id ?? uniqueId;

	return (
		<FormFieldShell id={finalId} label={label} hint={hint}>
			<input id={finalId} name={name} className="form-input" {...props} type="date" />
		</FormFieldShell>
	);
}
