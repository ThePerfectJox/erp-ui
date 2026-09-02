/**
 * erp-ui-components/forms/NumberInput.tsx
 *
 * A plain `<input type="number">` — min/max/step/value/onChange all work
 * natively. Adds the `form-input` class, merged with your own `className`.
 * Styling lives in ./index.css.
 */

import type { ComponentPropsWithoutRef } from "react";
import { mergeClassNames } from "./formsUtils";
import "./index.css";

export type NumberInputProps = Omit<ComponentPropsWithoutRef<"input">, "type">;

export default function NumberInput({ className, ...props }: NumberInputProps) {
	return <input type="number" className={mergeClassNames("form-input", className)} {...props} />;
}
