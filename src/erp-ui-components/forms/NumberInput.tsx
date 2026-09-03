import { useId } from "react";
import type { ChangeEventHandler } from "react";
import FormFieldShell from "./FormFieldShell";
import "./index.css";

export interface NumberInputProps {
	id?: string;
	name: string;
	label: string;
	hint?: string;
	placeholder?: string;
	defaultValue?: number | string;
	value?: number | string;
	onChange?: ChangeEventHandler<HTMLInputElement>;
	required?: boolean;
	disabled?: boolean;
	min?: number;
	max?: number;
	step?: number;
}

export default function NumberInput({ id, name, label, hint, ...props }: NumberInputProps) {
	const uniqueId = useId();
	const finalId = id ?? uniqueId;

	return (
		<FormFieldShell id={finalId} label={label} hint={hint}>
			<input id={finalId} name={name} className="form-input" {...props} type="number" />
		</FormFieldShell>
	);
}
