interface HeaderProps {
	text: string;
}

export default function Header({ text }: HeaderProps) {
	return (
		<header>
			{text}
		</header>
	);
}
