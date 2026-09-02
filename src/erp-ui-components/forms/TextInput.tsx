/**
 * erp-ui-components/forms/TextInput.tsx
 *
 * A plain `<input type="text">` — every native attribute (value, onChange,
 * placeholder, required, disabled, ...) works exactly as it would on the
 * element itself. The only thing this adds is the `form-input` class, merged
 * with whatever `className` you pass in, so you don't retype it at every
 * call site. Styling lives in ./index.css.
 */

import type { ComponentPropsWithoutRef } from "react";
import { mergeClassNames } from "./formsUtils";
import "./index.css";

export type TextInputProps = Omit<ComponentPropsWithoutRef<"input">, "type">;

export default function TextInput({ className, ...props }: TextInputProps) {
	return <input type="text" className={mergeClassNames("form-input", className)} {...props} />;
}
