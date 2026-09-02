/**
 * erp-ui-components/forms/FormRow.tsx
 *
 * Lays its children out side by side — but only at desktop widths (see the
 * media query in ./index.css); below that they stack, one per line, like
 * normal form fields. Pure CSS, no JS viewport detection.
 */

import type { ReactElement } from "react";
import "./index.css";

export interface FormRowProps {
	children: ReactElement | ReactElement[];
}

export default function FormRow({ children }: FormRowProps) {
	return <div className="form-row">{children}</div>;
}
