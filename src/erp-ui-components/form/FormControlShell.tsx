import type { ReactNode } from 'react'
import type { FieldAdornment } from './FieldTypes'

interface FormControlShellProps {
	/** Fixed text or mark before the value — a currency symbol, a search glyph. */
	prefix?: FieldAdornment
	/** Fixed text or mark after the value — a unit, a percent sign. */
	suffix?: FieldAdornment
	children: ReactNode
}

function renderAffix(affix: FieldAdornment, position: 'prefix' | 'suffix') {
	/* A string here is a label, not a URL — unlike Button's `logo`, which is an
	 * image. "EA", "kg", "%" and "$" are what actually get passed, and they
	 * should render as text. Pass a node for an image or an inline <svg>. */
	return (
		<span className={`form-control-affix form-control-${position}`} aria-hidden="true">
			{affix}
		</span>
	)
}

/**
 * Wraps a control so fixed text can sit inside the field box with it — the unit
 * on a quantity, the currency on an amount.
 *
 * The affixes are `aria-hidden`, so whatever they say has to be in the label
 * too ("Net weight (kg)", not "Net weight" with a bare `kg` suffix). A unit
 * that only exists as decoration is a unit a screen reader user never hears,
 * and on a goods receipt that is the difference between 5kg and 5 tonnes.
 *
 * Returns the control untouched when there is nothing to attach, so no field
 * carries a wrapper it has no use for.
 */
function FormControlShell({ prefix, suffix, children }: FormControlShellProps) {
	if (prefix === undefined && suffix === undefined) {
		return <>{children}</>
	}

	return (
		<div className="form-control-shell">
			{prefix !== undefined && renderAffix(prefix, 'prefix')}
			{children}
			{suffix !== undefined && renderAffix(suffix, 'suffix')}
		</div>
	)
}

export default FormControlShell
