/**
 * The invisible strip on a column's right edge or a row's bottom edge that you
 * drag to resize it.
 *
 * Holds no state and knows nothing about sizes — it is a hit area, and the
 * gesture props come from `useGridSizing`. That split is why the same component
 * serves both axes.
 *
 * ```tsx
 * <ResizeHandle axis="column" {...sizing.getResizeProps('column', column.key, width)} />
 * ```
 */

import type { ResizeAxis } from '../core/types'
import type { ResizeGestureProps } from '../hooks/useGridSizing'

interface ResizeHandleProps extends ResizeGestureProps {
	axis: ResizeAxis
}

function ResizeHandle({ axis, ...gestures }: ResizeHandleProps) {
	return (
		<span
			className={axis === 'column' ? 'grid-resize-column' : 'grid-resize-row'}
			/* Decorative to assistive technology: a drag handle it cannot operate,
			 * and every column already has a usable declared width. Resizing is a
			 * visual convenience here, not a way to reach data. */
			aria-hidden="true"
			{...gestures}
		/>
	)
}

export default ResizeHandle
