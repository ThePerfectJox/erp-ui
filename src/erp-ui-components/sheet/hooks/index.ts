/**
 * The grid's behaviour, one hook per concern.
 *
 * Split this way because the concerns genuinely do not overlap — the sort order
 * has nothing to say about clipboard formats, and column widths have nothing to
 * say about either. Kept in one component they shared a 1,000-line function and a
 * dozen pieces of state, and the only way to know whether a change to one broke
 * another was to read all of it.
 *
 * They are composed in `DataGrid.tsx` in dependency order, which is also a
 * reasonable reading order:
 *
 * 1. `useGridSizing` — widths and heights. Depends on nothing.
 * 2. `useGridView` — sort and display order.
 * 3. `useGridDirtyRows` — the unsaved-changes set.
 * 4. `useGridWriter` — the single write path. Needs the view and the dirty set.
 * 5. `useGridSelection` — what is selected, and the pointer gestures.
 * 6. `useGridEditing` — the open editor. Needs the writer and the selection.
 * 7. `useGridClipboard` — copy, cut, paste. Needs the writer and the selection.
 * 8. `useGridKeyboard` — the key map. Needs everything above it.
 *
 * `DataGrid` uses one more hook that is not here: `useOutsidePointerDown`, which
 * lives in `../../shared` because there is nothing grid-shaped about "notice a press
 * outside this element". It is imported from there directly rather than re-exported
 * through this barrel — a folder barrel that forwards other folders' exports makes
 * it impossible to tell, at the import site, which layer a thing belongs to.
 */

export { useGridClipboard } from './useGridClipboard'
export type { GridClipboardApi } from './useGridClipboard'

export { useGridDirtyRows } from './useGridDirtyRows'
export type { GridDirtyRowsApi } from './useGridDirtyRows'

export { useGridEditing } from './useGridEditing'
export type { GridEditingApi } from './useGridEditing'

export { useGridKeyboard } from './useGridKeyboard'

export { RANGE_ARMING_DELAY_MS, useGridSelection } from './useGridSelection'
export type { GridSelectionApi } from './useGridSelection'

export { useGridSizing } from './useGridSizing'
export type { GridSizingApi, ResizeGestureProps } from './useGridSizing'

export { useGridView } from './useGridView'
export type { GridView } from './useGridView'

export { useGridWriter } from './useGridWriter'
export type { GridWriter, WriteBlock } from './useGridWriter'
