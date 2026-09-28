/**
 * The shell every chart in this folder sits in: caption, description, the measured
 * plot area, the legend, and the data table that makes the chart readable to
 * assistive technology.
 *
 * Shared rather than repeated three times, because all four of those are the same
 * problem in a bar chart, a line chart and a donut — and the accessible table in
 * particular is the part most likely to be quietly dropped from the third one.
 */

import { useRef } from 'react'
import type { ReactNode } from 'react'
import { classNames } from '../../shared/classNames'
import type { ChartLegendPlacement } from '../core/types'
import { useElementWidth } from '../hooks/useElementWidth'

interface ChartFrameProps {
	caption: string
	isCaptionHidden?: boolean
	description?: string

	/** Plot height in pixels. The width is measured, never given. */
	height: number

	/** A `<ChartLegend>`, or nothing. */
	legend?: ReactNode

	legendPlacement: ChartLegendPlacement

	/** A `<ChartDataTable>`. Not optional — see the note below. */
	dataTable: ReactNode

	className?: string

	/**
	 * Renders the SVG, given the measured width.
	 *
	 * A render prop rather than plain children because the width is not known until
	 * the container exists, and every coordinate in the chart depends on it. The
	 * alternative — passing the width down through props from a parent that also has
	 * to own the ref — puts the measurement one level away from the thing being
	 * measured.
	 */
	children: (width: number) => ReactNode
}

/**
 * ```tsx
 * <ChartFrame caption="Net value by material" height={220} legendPlacement="bottom"
 *             legend={<ChartLegend … />} dataTable={<ChartDataTable … />}>
 *     {width => <svg width={width} height={220} aria-hidden="true">…</svg>}
 * </ChartFrame>
 * ```
 *
 * -----------------------------------------------------------------------------
 * The SVG is hidden, the table is not
 * -----------------------------------------------------------------------------
 * Every chart here marks its `<svg>` `aria-hidden` and renders the same data as a
 * real, visually-hidden `<table>` beside it. That is the whole accessibility
 * strategy, and it is a deliberate choice over the usual one.
 *
 * The usual one is `role="img"` with an `aria-label` summarising the chart. It
 * satisfies an audit and it is nearly useless: a screen reader user gets a
 * one-sentence description of a picture everyone else can read values off. The
 * numbers are the content. A table hands them over in a form that can be navigated
 * cell by cell, compared, and read at whatever pace the user wants.
 *
 * It also costs nothing visually, and it is what makes the tooltips defensible —
 * a hover-only affordance is fine when the information it reveals is already
 * available another way.
 */
function ChartFrame({
	caption,
	isCaptionHidden,
	description,
	height,
	legend,
	legendPlacement,
	dataTable,
	className,
	children,
}: ChartFrameProps) {
	const plotRef = useRef<HTMLDivElement>(null)
	const width = useElementWidth(plotRef)

	return (
		/* A <figure>, because that is what this is: content with a caption. The
		 * <figcaption> then names it without needing an id and an aria-labelledby. */
		<figure className={classNames('chart', className)}>
			<figcaption className={classNames('chart-caption', isCaptionHidden && 'erp-visually-hidden')}>
				{caption}
			</figcaption>

			{description && <p className="chart-description">{description}</p>}

			{legendPlacement === 'top' && legend}

			{/* The measured box. `position: relative` in the stylesheet makes it the
			  * containing block for the tooltip, which is HTML rather than SVG so it
			  * can size itself to its own text. */}
			<div className="chart-plot" ref={plotRef} style={{ height }}>
				{children(width)}
			</div>

			{legendPlacement === 'bottom' && legend}

			{dataTable}
		</figure>
	)
}

export default ChartFrame
