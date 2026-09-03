import { useId } from "react";
import type { ChangeEventHandler } from "react";
import FormFieldShell from "./FormFieldShell";
import "./index.css";

export interface TextAreaProps {
	id?: string;
	name: string;
	label: string;
	hint?: string;
	placeholder?: string;
	defaultValue?: string;
	value?: string;
	onChange?: ChangeEventHandler<HTMLTextAreaElement>;
	required?: boolean;
	disabled?: boolean;
	rows?: number;
}

export default function TextArea({ id, name, label, hint, ...props }: TextAreaProps) {
	const uniqueId = useId();
	const finalId = id ?? uniqueId;

	return (
		<FormFieldShell id={finalId} label={label} hint={hint}>
			<textarea id={finalId} name={name} className="form-textarea" {...props} />
		</FormFieldShell>
	);
}
