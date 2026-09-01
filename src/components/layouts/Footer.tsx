interface FooterProps {
	text: string;
}

export default function Footer({ text }: FooterProps) {
	return (
		<footer>
			{text}
		</footer>
	);
}
