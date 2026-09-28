/**
 * Measures an element's width and keeps it current as the element resizes.
 *
 * -----------------------------------------------------------------------------
 * Why measure at all
 * -----------------------------------------------------------------------------
 * The cheap way to make an SVG chart responsive is a fixed `viewBox` with
 * `width="100%"`, letting the browser scale it. It needs no measuring and no
 * effects, and it is wrong for a chart with text in it: scaling the SVG scales the
 * axis labels too. Put two charts side by side in cards of different widths and
 * their labels come out at different sizes — the narrower chart's type shrinks
 * below legible and the wider one's inflates past the body text around it.
 *
 * Measuring instead means laying out in real CSS pixels, so 11px axis labels are
 * 11px in every chart on the screen. The cost is this file.
 */

import { useEffect, useState } from 'react'
import type { RefObject } from 'react'

/**
 * Width used for the first render, before the element has been measured.
 *
 * Charts render at this width once and then immediately re-render at the real one.
 * A plausible card width rather than 0, so server-rendered and test output is a
 * usable chart rather than a collapsed one — and so the single frame before the
 * observer reports is not a visible flash of nothing.
 */
export const FALLBACK_CHART_WIDTH = 640

/**
 * @param ref The element to measure. Its *content* width is reported, so padding
 *            on the element is already excluded and the chart never overflows it.
 */
export function useElementWidth(ref: RefObject<HTMLElement | null>): number {
	const [width, setWidth] = useState(FALLBACK_CHART_WIDTH)

	useEffect(() => {
		const element = ref.current

		if (!element) {
			return
		}

		/* Not available under SSR or in a bare test environment. Falling back to the
		 * measurement below leaves a chart at whatever width it was at mount, which
		 * is correct until something resizes — and nothing resizes in a renderer
		 * that has no layout. */
		if (typeof ResizeObserver === 'undefined') {
			setWidth(element.clientWidth || FALLBACK_CHART_WIDTH)

			return
		}

		const observer = new ResizeObserver(entries => {
			const entry = entries[0]

			if (!entry) {
				return
			}

			/* `contentBoxSize` rather than `getBoundingClientRect().width`: the border
			 * box includes padding, and a chart laid out to the border box draws its
			 * last gridline underneath the container's padding.
			 *
			 * The array form is the spec'd one; some older engines expose a bare
			 * object instead, hence the check. */
			const contentBox = Array.isArray(entry.contentBoxSize)
				? entry.contentBoxSize[0]
				: (entry.contentBoxSize as unknown as ResizeObserverSize | undefined)

			const nextWidth = contentBox ? contentBox.inlineSize : entry.contentRect.width

			/* Rounded, and this matters more than it looks: a fractional container
			 * width from a flex or grid layout changes by hundredths as the page
			 * settles, and an unrounded value would set state — and re-render every
			 * mark in the chart — on each of those. */
			setWidth(Math.round(nextWidth))
		})

		observer.observe(element)

		return () => observer.disconnect()
	}, [ref])

	return width
}
