/**
 * erp-ui-components/forms/Combobox.tsx
 *
 * A dropdown with a text input — the native way: a text `<input>` wired to a
 * <datalist> via the `list` attribute. Typing filters the suggestions and
 * picking one fills the input; both are handled by the browser, no keyboard
 * navigation or open/close state to build ourselves. `id` falls back to
 * useId() (same convention as the rest of erp-ui-components) since the
 * <datalist> needs a stable id to point `list` at.
 */

import { useId } from "react";
import type { ComponentPropsWithoutRef } from "react";
import { mergeClassNames, normalizeComboboxOptions, type FormOption } from "./formsUtils";
import "./index.css";

export interface ComboboxProps extends Omit<ComponentPropsWithoutRef<"input">, "type" | "list"> {
	options: (string | FormOption)[];
}

export default function Combobox({ id, options, className, ...props }: ComboboxProps) {
	const uniqueId = useId();
	const finalId = id ?? uniqueId;
	const listId = `${finalId}-options`;
	const normalizedOptions = normalizeComboboxOptions(options);

	return (
		<>
			<input
				type="text"
				id={finalId}
				list={listId}
				className={mergeClassNames("form-input", className)}
				{...props}
			/>
			<datalist id={listId}>
				{normalizedOptions.map((option) => (
					<option key={option.value} value={option.value}>
						{option.label}
					</option>
				))}
			</datalist>
		</>
	);
}
