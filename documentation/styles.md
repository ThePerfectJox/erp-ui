# `styles/` — the theme

The library's entire global stylesheet. Everything visual in `erp-ui` reads
from the design tokens defined here.

```tsx
import './erp-ui-components/styles/index.css'
```

Load it once, from your entry point, before anything else. Component
stylesheets do not import it themselves — a component that pulled in the whole
theme would drag the tokens into the bundle once per component and make the
cascade order depend on which component the bundler happened to evaluate first.

## The three files

`styles/index.css` is just three `@import`s, in this order (which is not
alphabetical, and matters):

| File | Contains | Required |
| --- | --- | --- |
| `tokens.css` | `:root` custom properties, nothing else | **Yes.** Every stylesheet reads them. |
| `base.css` | element defaults, focus ring, motion reset | Mostly — see below. |
| `a11y.css` | the visually-hidden helper (`.erp-visually-hidden`) | **Yes.** Four components apply the class. |

Tokens come first because the other two read them; `a11y` comes last because
its helper has to win against component rules.

`base.css` is the only opinionated file — it styles `body`, headings, links and
bare `<button>`s, which an app with its own reset may already own. If you drop
it, keep its `:focus-visible` and `prefers-reduced-motion` rules: the
components assume both exist and declare neither themselves.

## The design language: SAP Fiori "Morning Horizon"

`tokens.css` holds values and nothing else — no selectors beyond `:root`. That
separation is what makes it swappable: to retheme the whole library, replace
this one file and leave everything else alone.

The values are taken from SAP's own `sap_horizon` theming base content, so the
app reads as a Fiori application rather than a generic admin template. The token
names stay generic (`--color-primary`, not `--sapBrandColor`) so the palette can
be swapped for a non-SAP one without renaming anything downstream.

Three rules do most of the work:

1. **One blue means "you can act on this."** Links, the focus ring, the standard
   button's label, the field underline on hover — all the same `#0070f2`
   family. Nothing decorative is ever blue, so blue always means the same thing.
2. **Fields are filled, not outlined.** An editable field is a grey box with a
   darker line under it; the page behind it is lighter grey; cards are white. So
   "where can I type" is answered by fill, at a glance. Read-only swaps the solid
   underline for a dashed one and drops the fill — a difference that survives
   greyscale and colour blindness.
3. **State is never colour alone.** An invalid field gets a 2px underline, a
   tinted fill *and* a message; a required field gets an asterisk (WCAG 1.4.1).

## Token reference

### Brand / interaction

| Token | Value | Role |
| --- | --- | --- |
| `--color-primary` | `#0070f2` | the one interaction blue |
| `--color-primary-hover` | `#0064d9` | also the link colour |
| `--color-primary-active` | `#0058bf` | pressed |
| `--color-primary-soft` | `#e1f4ff` | selected-row tint |
| `--color-on-primary` | `#ffffff` | text on a filled brand button |

### Semantic status

Each state ships a text colour (dark enough to read on white) and an element
colour (brighter, for borders and icons), so a message never has to choose
between being legible and being visible.

| State | Text | Border/element | Soft fill |
| --- | --- | --- | --- |
| success | `#256f3a` | `#2b7d42` | `#f5fae5` |
| warning | `#b44f00` | `#dd6100` | `#fff8d6` |
| danger | `#aa0808` | `#e90b0b` | `#ffeaf4` (pink, not peach) |
| info | `#0064d9` | `#0070f2` | `#e1f4ff` |

`--color-required` is `#ba066c` (magenta, not red) — SAP keeps red for things
that are actually wrong, so a form full of required fields does not look like a
form full of errors before it is touched.

### Surfaces

Four tones, and the order is load-bearing (rule 2 above trades on it) — never
reorder these:

| Token | Value | Use |
| --- | --- | --- |
| `--color-surface` | `#ffffff` | cards, dialogs, tables (lightest) |
| `--color-bg` | `#f5f6f7` | the canvas behind cards |
| `--color-surface-alt` | `#f5f6f7` | zebra rows inside a white card |
| `--color-surface-sunken` | `#eff1f2` | editable fields, wells (darkest) |

A field is always darker than the card it sits on, which is always lighter than
the page.

### Text, lines and focus

`--color-text` `#131e29`, `--color-text-muted` `#556b82` (labels),
`--color-text-subtle` `#758ca4` (hints/placeholders). `--color-field-border`
`#556b81` is much darker than the ordinary `--color-border` `#e5e5e5` because it
is the underline that marks a field as editable. `--color-focus-ring` `#0032a5`
is a darker navy than the brand blue, so a focused control still reads as focused
while it is also hovered.

### Chart palette

Eight categorical colours (`--chart-1` … `--chart-8`), used in order. The first
five are literally tokens from above; the last three sit between them at a
similar lightness so no series reads louder than its neighbours.

Two rules the chart components depend on: **no red** (red means "wrong"
everywhere else — a semantic chart passes `--color-danger-border` explicitly on
a series instead), and **colour is never the only cue** (every series is named
in the legend and repeated in the accessible data table). Each clears 3:1
against the surface (WCAG 1.4.11).

`--chart-1` `#0070f2` blue · `--chart-2` `#6c32a9` purple · `--chart-3`
`#2b7d42` green · `--chart-4` `#dd6100` orange · `--chart-5` `#5b738b` slate ·
`--chart-6` `#047d7a` teal · `--chart-7` `#ba066c` magenta · `--chart-8`
`#4a4ecc` indigo.

### Typography

Base is **14px** (`--text-md`), the density business software is read at, not
16px. The scale climbs `--text-xs` `11px` → `--text-2xl` `22px`. Weights
`--weight-normal` 400 through `--weight-bold` 700. Font stack is SAP's "72" with
Arial fallback.

### Spacing, radius, control metrics, motion

- **Spacing** is a 4px base: `--space-1` `0.25rem` … `--space-8` `3rem`.
- **Radius**: `--radius-sm` 4px (fields — tighter), `--radius-md` 8px (buttons),
  `--radius-lg` 12px (cards). The field/button difference is a quiet signal of
  "fill in" versus "press".
- **Control metrics**: `--control-height` 36px (cozy, the default),
  `--control-height-compact` 26px. `--form-label-width` 10rem is the gutter a
  `beside`-layout form lines its labels up on.
- **Motion**: `--transition-fast` `120ms`, `--transition` `200ms`.

## The visually-hidden helper

`a11y.css` defines `.erp-visually-hidden`, which takes an element off screen
while keeping it in the accessibility tree. Four components apply it: `FormField`
(hidden labels), `ViewTable` and `DataGrid` (hidden captions and screen-reader
scaffolding), and the charts (their data tables). It uses a doubled selector to
win specificity against component rules, which is why `a11y.css` loads last.
