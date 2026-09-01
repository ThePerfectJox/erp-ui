import type { ReactNode } from "react";

interface ContentProps {
	component: ReactNode;
}

export default function Content({ component }: ContentProps) {
	return (
		<main>
			{component}
		</main>
	);
}
