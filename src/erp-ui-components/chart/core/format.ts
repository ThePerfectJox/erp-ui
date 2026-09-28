/**
 * Number formatting for axes and labels, and the palette lookup.
 */

import type { ChartValueFormatter } from './types'

/**
 * How many colours the palette in `index.css` defines.
 *
 * Series past this wrap round and repeat, which is the least-bad option: throwing
 * would take down a screen over a cosmetic problem, and generating extra colours
 * produces ones that clash with the tokens. A chart with more than eight series is
 * unreadable regardless of how many colours it has — that is the real problem to
 * fix at the call site.
 */
const PALETTE_SIZE = 8

/**
 * The colour for the nth series: its own, or the palette's.
 *
 * Returns a `var()` reference rather than a hex value, so a chart re-themes with
 * the rest of the app and a forced-colours mode can override it in CSS.
 */
export function seriesColor(index: number, explicitColor?: string): string {
	if (explicitColor) {
		return explicitColor
	}

	return `var(--chart-${(index % PALETTE_SIZE) + 1})`
}

/**
 * Compact form for axis labels: `1.2k`, `3.4m`, `2.1bn`.
 *
 * Axis labels are the one place a long number does real damage — six digits at
 * every gridline either overlaps its neighbour or eats a third of the plot's width.
 * Everywhere the exact number matters (the tooltip, the accessible table) gets
 * {@link formatFull} instead.
 */
export function formatCompact(value: number): string {
	const magnitude = Math.abs(value)

	if (magnitude >= 1e9) {
		return `${trim(value / 1e9)}bn`
	}

	if (magnitude >= 1e6) {
		return `${trim(value / 1e6)}m`
	}

	if (magnitude >= 1e4) {
		/* Deliberately not 1e3. Four-digit numbers are the everyday case in an ERP —
		 * quantities, item counts — and "1.2k" is a worse label than "1200" when
		 * there is room for both. Only past ten thousand does the abbreviation start
		 * earning its loss of precision. */
		return `${trim(value / 1e3)}k`
	}

	return trim(value)
}

/**
 * The full number, grouped.
 *
 * `Intl.NumberFormat` with the browser's own locale, so a German user sees
 * `1.234,5` and an English one `1,234.5` — the same rule their spreadsheet uses.
 * Capped at two decimals, because a float total like 40.400000000000006 would
 * otherwise be printed in full.
 */
export function formatFull(value: number): string {
	return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value)
}

/** The formatter a chart should use, honouring an override. */
export function resolveFormatter(override: ChartValueFormatter | undefined): ChartValueFormatter {
	return override ?? formatFull
}

/** The axis formatter: compact unless the caller supplied its own. */
export function resolveAxisFormatter(override: ChartValueFormatter | undefined): ChartValueFormatter {
	/* An override wins on the axis too. A caller who formats values as "€1,234.00"
	 * wants that on the axis as well; silently abbreviating there would leave the
	 * axis and the tooltip reading in different currencies' worth of detail. */
	return override ?? formatCompact
}

/**
 * A share as a percentage, for donut labels.
 *
 * One decimal below 10% and none above, so a 0.4% slice does not read as "0%" and
 * vanish from the legend while still being drawn in the chart.
 */
export function formatShare(value: number, total: number): string {
	if (total <= 0) {
		return '0%'
	}

	const share = (value / total) * 100

	return `${share < 10 ? Math.round(share * 10) / 10 : Math.round(share)}%`
}

/** Drops a trailing `.0`, so 1.0 reads as 1 and 1.2 stays 1.2. */
function trim(value: number): string {
	const rounded = Math.round(value * 10) / 10

	return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}
