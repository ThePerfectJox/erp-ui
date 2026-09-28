/**
 * =============================================================================
 * erp-ui-components — a self-contained Fiori-flavoured component library
 * =============================================================================
 *
 * ```tsx
 * import { Button, DataGrid, Form, Layout, Modal, BarChart } from './erp-ui-components'
 * ```
 *
 * -----------------------------------------------------------------------------
 * Copying this folder into another project
 * -----------------------------------------------------------------------------
 * The folder is the unit. Copy `erp-ui-components/` anywhere in a React project and
 * it works, because everything it needs is inside it — including the design tokens
 * and the base element styles, which used to live in the application's own
 * `src/index.css` and made the library quietly dependent on its host.
 *
 * Two things to do at the other end:
 *
 * 1. **Load the theme once, from your entry point**, before anything else:
 *
 *    ```tsx
 *    import './erp-ui-components/styles/index.css'
 *    ```
 *
 *    Importing from this barrel pulls it in too, so strictly it is optional. Doing it
 *    explicitly puts the tokens at the head of the cascade regardless of which
 *    component your bundler happens to evaluate first, which is worth the one line.
 *
 * 2. **Provide a router if you use `Layout`.** Its sidebar links are
 *    `react-router-dom` `NavLink`s. That is the only third-party dependency anywhere
 *    in here and it is confined to one twenty-line file,
 *    `layout/Sidebar/SidebarSubMenu.tsx` — rewrite it for a different router, or for
 *    plain anchors, and the library needs nothing but React.
 *
 * One thing that is **not** self-contained: the `.svg` imports in `assets/`. They
 * resolve to URLs through a bundler that understands them — Vite does out of the
 * box. In a project without that, the three `import icon from './x.svg'` lines in
 * `layout/` need adjusting.
 *
 * -----------------------------------------------------------------------------
 * What is in here
 * -----------------------------------------------------------------------------
 * | Folder | Holds |
 * | --- | --- |
 * | `styles/` | design tokens, base element styles, the visually-hidden helper |
 * | `shared/` | primitives used by more than one folder |
 * | `form/` | twelve controls, the form shell, and the field system behind them |
 * | `sheet/` | `DataGrid` — an Excel-like editable grid |
 * | `chart/` | bar, line and donut charts, drawn by hand in SVG |
 * | `overlay/` | `Modal`, built on the native `<dialog>` |
 * | `layout/` | the page shell and its navigation rail |
 * | `assets/` | the handful of icons the layout needs |
 *
 * Every component folder follows the same shape, so finding your way around one
 * teaches you the rest:
 *
 * - **`core/`** — pure logic. No React, no DOM, no state. The part worth reading
 *   first when something misbehaves, and the part worth testing.
 * - **`hooks/`** — behaviour and state.
 * - **`parts/`** — internal presentational pieces, not exported.
 * - **`styles/`** or a single `.css` — the look.
 *
 * The folder's own `index.ts` is the public API in each case; anything not exported
 * from one is internal and shaped around its current callers rather than around
 * being reusable.
 *
 * -----------------------------------------------------------------------------
 * A note on this barrel
 * -----------------------------------------------------------------------------
 * It re-exports everything, which is convenient and costs you tree-shaking
 * granularity on some bundler configurations. Importing from the folder barrels
 * instead — `from './erp-ui-components/form'` — is equally supported and is what the
 * demo screen does.
 */

import './styles/index.css'

export * from './shared'

export * from './chart'
export * from './form'
export * from './layout'
export * from './overlay'
export * from './sheet'
