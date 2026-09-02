/**
 * erp-ui-components/forms/SubmitButton.tsx
 *
 * A plain `<button type="submit">`. Give it `onSubmitValues` and it reads
 * its owning <form> through the native `button.form` property (no ref
 * plumbing needed), turns the current FormData into a plain object via
 * formsUtils.getFormValues, and calls you back with it instead of letting
 * the browser do a native form submission. Without `onSubmitValues` it's
 * just a normal submit button.
 */

import type { ComponentPropsWithoutRef, MouseEventHandler } from "react";
import { getFormValues, mergeClassNames, type FormValues } from "./formsUtils";
import "./index.css";

export interface SubmitButtonProps extends Omit<ComponentPropsWithoutRef<"button">, "type"> {
	onSubmitValues?: (values: FormValues) => void;
}

export default function SubmitButton({
	className,
	onClick,
	onSubmitValues,
	children,
	...props
}: SubmitButtonProps) {
	const handleClick: MouseEventHandler<HTMLButtonElement> = (event) => {
		onClick?.(event);
		const form = event.currentTarget.form;
		if (onSubmitValues && form) {
			event.preventDefault();
			onSubmitValues(getFormValues(form));
		}
	};

	return (
		<button
			type="submit"
			className={mergeClassNames("form-submit-button", className)}
			onClick={handleClick}
			{...props}
		>
			{children ?? "Submit"}
		</button>
	);
}
