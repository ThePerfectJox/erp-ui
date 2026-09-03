// Lays its children side by side at desktop widths (see the media query in
// ./index.css); below that they stack, one per line. Pure CSS, no JS.

import type { ReactNode } from "react";
import "./index.css";

export interface FormRowProps {
	children: ReactNode;
}

export default function FormRow({ children }: FormRowProps) {
	return <div className="form-row">{children}</div>;
}
