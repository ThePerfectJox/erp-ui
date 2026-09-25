/**
 * Clipboard interchange with Excel.
 *
 * Excel does not have a proprietary web clipboard format. What it actually reads
 * and writes through the system clipboard is two ordinary flavours:
 *
 * - `text/plain` — **tab**-separated values, rows separated by CRLF. Not commas.
 *   A field is wrapped in double quotes when it contains a tab, a line break or
 *   a quote, and an embedded quote is doubled. Same escaping rules as CSV, a
 *   different delimiter.
 * - `text/html` — a plain `<table>`. Excel prefers this when present and it is
 *   what carries alignment and number formatting.
 *
 * So interop is not an integration, it is getting these two strings exactly
 * right. Everything here is pure and string-in/string-out, which is also what
 * makes it the part worth testing hardest.
 */

/** A rectangular block of cells as text. Outer array is rows. */
export type CellMatrix = string[][]

const QUOTE = '"'
const TAB = '\t'

/**
 * Excel writes CRLF between rows. LF alone is accepted on paste but Windows
 * Excel is the target here, so CRLF is what gets written.
 */
const ROW_SEPARATOR = '\r\n'

/** A field needs quoting when a bare version of it would be ambiguous. */
function needsQuoting(value: string): boolean {
	return value.includes(TAB) || value.includes('\n') || value.includes('\r') || value.includes(QUOTE)
}

function quoteField(value: string): string {
	if (!needsQuoting(value)) {
		return value
	}

	/* Doubling is how a literal quote is written inside a quoted field. Escaping
	 * it with a backslash — the instinct from most other formats — produces a
	 * visible backslash in the Excel cell. */
	return QUOTE + value.replaceAll(QUOTE, QUOTE + QUOTE) + QUOTE
}

/**
 * Serialises a block of cells as the TSV Excel expects on the clipboard.
 *
 * ```ts
 * toTsv([['Material', 'Qty'], ['R-1104', '120']])
 * // 'Material\tQty\r\nR-1104\t120'
 * ```
 *
 * A cell holding a line break survives the round trip: it comes out quoted here
 * and Excel puts it in a single cell as wrapped text.
 */
export function toTsv(matrix: CellMatrix): string {
	return matrix.map(row => row.map(quoteField).join(TAB)).join(ROW_SEPARATOR)
}

/**
 * Parses clipboard TSV into a block of cells.
 *
 * Written as a character state machine rather than `split('\n').map(split('\t'))`,
 * because the naive version breaks on exactly the data people paste from a real
 * spreadsheet: a cell containing a line break, or one containing a tab. Those
 * arrive quoted, and splitting cuts them in half — silently, producing a grid
 * that is subtly misaligned rather than obviously broken.
 *
 * ```ts
 * fromTsv('a\tb\r\nc\td')            // [['a', 'b'], ['c', 'd']]
 * fromTsv('"multi\nline"\tb')        // [['multi\nline', 'b']]
 * fromTsv('"say ""hi"""\tb')         // [['say "hi"', 'b']]
 * ```
 *
 * Rows are returned exactly as they came, including ragged ones — the caller
 * knows the shape it wants and can pad or clip. The single exception is the
 * trailing empty row Excel leaves behind, which is dropped.
 */
export function fromTsv(text: string): CellMatrix {
	if (text === '') {
		return []
	}

	const matrix: CellMatrix = []
	let row: string[] = []
	let field = ''
	let isQuoted = false
	let index = 0

	while (index < text.length) {
		const character = text[index]

		if (isQuoted) {
			if (character === QUOTE) {
				/* Two quotes inside a quoted field means one literal quote.
				 * A single one ends the field. */
				if (text[index + 1] === QUOTE) {
					field += QUOTE
					index += 2
					continue
				}

				isQuoted = false
				index += 1
				continue
			}

			/* Tabs and line breaks are ordinary characters in here. This is the
			 * whole reason for the state machine. */
			field += character
			index += 1
			continue
		}

		/* A quote only opens a quoted field at the very start of one. Anywhere
		 * else it is literal — matching how Excel and every CSV reader behave. */
		if (character === QUOTE && field === '') {
			isQuoted = true
			index += 1
			continue
		}

		if (character === TAB) {
			row.push(field)
			field = ''
			index += 1
			continue
		}

		if (character === '\r' || character === '\n') {
			row.push(field)
			field = ''
			matrix.push(row)
			row = []

			/* CRLF is one row break, not two. Consuming it as two would insert a
			 * blank row between every pasted row. */
			index += character === '\r' && text[index + 1] === '\n' ? 2 : 1
			continue
		}

		field += character
		index += 1
	}

	row.push(field)
	matrix.push(row)

	/* Excel terminates its payload with a row break, which leaves a final row of
	 * one empty field. Dropped — otherwise every paste appends a blank row and
	 * clears whatever it lands on. Only when it is unambiguously that artefact,
	 * so a deliberate trailing blank row in a multi-column selection survives. */
	const lastRow = matrix[matrix.length - 1]

	if (matrix.length > 1 && lastRow.length === 1 && lastRow[0] === '') {
		matrix.pop()
	}

	return matrix
}

function escapeHtml(value: string): string {
	return value
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
}

/**
 * True for values Excel would silently damage if it guessed their type.
 *
 * Two cases, both everyday ERP data:
 *
 * - A leading zero. `"000123"` becomes `123`, and a material or GL account
 *   number quietly loses its padding.
 * - More than fifteen digits. Excel stores numbers as IEEE 754 doubles, so a
 *   long document or EAN number gets rounded — `1234567890123456` comes back
 *   as `1234567890123450`.
 */
function wouldExcelMangle(value: string): boolean {
	if (!/^\d+$/.test(value)) {
		return false
	}

	return (value.length > 1 && value.startsWith('0')) || value.length > 15
}

/**
 * Serialises a block of cells as an HTML table for the clipboard.
 *
 * Worth providing alongside the TSV for two reasons. Excel and Google Sheets
 * both prefer `text/html` when it is on the clipboard, and it is the only way to
 * tell Excel *not* to interpret a value: `mso-number-format:'@'` is Excel's own
 * "treat this as text" instruction, which is what stops a material number like
 * `000123` arriving as `123`.
 *
 * It also means pasting into Word, Outlook or a browser gives a real table
 * rather than a wall of tabs.
 */
export function toHtml(matrix: CellMatrix): string {
	const rows = matrix
		.map(row => {
			const cells = row
				.map(value => {
					/* Excel reads this proprietary style property and skips its
					 * own type inference for the cell. Browsers ignore it. */
					const style = wouldExcelMangle(value) ? ` style="mso-number-format:'@'"` : ''

					/* A line break inside a cell has to be a <br> here — a raw
					 * newline in HTML is just whitespace and the cell would come
					 * out as one line. */
					const content = escapeHtml(value).replaceAll('\r\n', '<br>').replaceAll('\n', '<br>')

					return `<td${style}>${content}</td>`
				})
				.join('')

			return `<tr>${cells}</tr>`
		})
		.join('')

	/* `border-collapse` keeps the table tidy when pasted somewhere that renders
	 * it, and the charset meta stops Excel misreading non-ASCII on Windows —
	 * without it "São Paulo" arrives mojibaked. */
	return `<meta charset="utf-8"><table style="border-collapse:collapse">${rows}</table>`
}

/**
 * Writes a block of cells to the clipboard in both flavours.
 *
 * Called from a `copy` or `cut` event handler, where `clipboardData` is
 * synchronously writable. That is deliberately not `navigator.clipboard.write`:
 * the async API needs a secure context and, in some browsers, a permission
 * prompt, while the event route is universally available and needs neither
 * because the user already asked for a copy by pressing the keys.
 */
export function writeToClipboard(clipboardData: DataTransfer, matrix: CellMatrix): void {
	clipboardData.setData('text/plain', toTsv(matrix))
	clipboardData.setData('text/html', toHtml(matrix))
}

/**
 * Reads a block of cells from a paste.
 *
 * `text/plain` only. The HTML flavour on the clipboard is richer, but parsing it
 * means running untrusted markup from an unknown source through a DOM parser,
 * and Excel's TSV already carries every value losslessly. There is nothing to
 * gain and a real attack surface to lose.
 */
export function readFromClipboard(clipboardData: DataTransfer): CellMatrix {
	return fromTsv(clipboardData.getData('text/plain'))
}
