/**
 * erp-ui-components/forms/DateInput.tsx
 *
 * A plain `<input type="date">` — the browser's native date picker, native
 * "yyyy-mm-dd" value. Adds the `form-input` class, merged with your own
 * `className`. Styling lives in ./index.css.
 */

import type { ComponentPropsWithoutRef } from "react";
import { mergeClassNames } from "./formsUtils";
import "./index.css";

export type DateInputProps = Omit<ComponentPropsWithoutRef<"input">, "type">;

export default function DateInput({ className, ...props }: DateInputProps) {
	return <input type="date" className={mergeClassNames("form-input", className)} {...props} />;
}
