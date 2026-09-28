/**
 * Joins class names, dropping anything falsy.
 *
 * ```ts
 * classNames('form-field', `form-field-${variant}`, isDisabled && 'form-field-disabled', className)
 * ```
 *
 * Ten components were building this by hand before it existed — `const names =
 * ['base']`, then a run of `if (flag) names.push(…)`, then `.join(' ')`. Six or
 * seven lines each, in `FormField`, `Form`, `Button`, `FormActions`, `ComboBox`'s
 * option rows, `GridCell`, `GridRowGutterCell`, `Modal`, `ChartFrame` and
 * `DonutChart`.
 *
 * The array form is not wrong, it is just long enough to bury the interesting part
 * — which classes exist and what turns them on — under the mechanics of assembling
 * a string. As one expression the conditions line up and can be read down the
 * page.
 *
 * Falsy rather than only `undefined`, so `flag && 'name'` works directly. That is
 * the shape a conditional class arrives in, and requiring a ternary with an
 * explicit `undefined` branch for every one of them is noise.
 *
 * `false` and `null` are in the signature for the same reason: `flag && '…'` gives
 * `false`, and `map`/`find` results give `null`. Neither should need a cast at the
 * call site.
 */
export function classNames(...values: (string | false | null | undefined)[]): string {
	return values.filter(Boolean).join(' ')
}
