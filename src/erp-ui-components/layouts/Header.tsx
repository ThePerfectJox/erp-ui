import type { ReactNode } from "react";

interface HeaderProps {
	leftSide: ReactNode;
	text: string;
	rightSide?: ReactNode;
}

export default function Header({ leftSide, text }: HeaderProps) {
	return (
		<header>
			<div className="header-left">{leftSide}</div>
			<div className="header-center">{text}</div>
			<div className="header-right"></div>
		</header>
	);
}
