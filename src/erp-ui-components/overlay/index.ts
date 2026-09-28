/**
 * Things that sit on top of the page.
 *
 * ```tsx
 * import { Modal } from './erp-ui-components/overlay'
 * ```
 *
 * One component so far. `Modal` is built on the native `<dialog>` element, which
 * means the focus trap, the inert background, the top-layer stacking and `Esc`
 * are the browser's job rather than this folder's — read its doc comment for what
 * that does and does not cover.
 */

export { default as Modal } from './Modal'
export type { ModalSize } from './Modal'
