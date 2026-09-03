// A plain `<button type="submit">`. Give it `onSubmitValues` and it hands you
// the owning <form>'s data as a plain object on submit; without it, it's a
// normal submit button.

import { useEffect, useRef } from "react";
import { getFormValues, type FormValues } from "./formsUtils";
import "./index.css";

export interface SubmitButtonProps {
	id?: string;
	label: string;
	onSubmitValues?: (values: FormValues) => void;
	disabled?: boolean;
}

export default function SubmitButton({ id, label, onSubmitValues, disabled }: SubmitButtonProps) {
	const buttonRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		const form = buttonRef.current?.form;
		if (!onSubmitValues || !form) return;

		// Listening on the button's own click and calling preventDefault there
		// would cancel its native "activation behavior" — the step that runs
		// HTML constraint validation (required/min/max/pattern) — before it
		// ever gets to run, and it wouldn't fire on Enter-to-submit at all.
		// The form's `submit` event only fires once validation has already
		// passed, regardless of how submission was triggered.
		const handleSubmit = (event: SubmitEvent) => {
			event.preventDefault();
			onSubmitValues(getFormValues(form));
		};
		form.addEventListener("submit", handleSubmit);
		return () => form.removeEventListener("submit", handleSubmit);
	}, [onSubmitValues]);

	return (
		<button id={id} ref={buttonRef} className="form-submit-button" type="submit" disabled={disabled}>
			{label}
		</button>
	);
}
