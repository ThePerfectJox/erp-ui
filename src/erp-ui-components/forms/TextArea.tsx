/**
 * erp-ui-components/forms/TextArea.tsx
 *
 * A plain `<textarea>` with the `form-textarea` class merged in — same deal
 * as TextInput, just multi-line. Styling lives in ./index.css.
 */

import type { ComponentPropsWithoutRef } from "react";
import { mergeClassNames } from "./formsUtils";
import "./index.css";

export type TextAreaProps = ComponentPropsWithoutRef<"textarea">;

export default function TextArea({ className, ...props }: TextAreaProps) {
	return <textarea className={mergeClassNames("form-textarea", className)} {...props} />;
}
