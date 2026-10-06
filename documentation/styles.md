# Styles (the theme)

## What it is

`styles/` is the library's global stylesheet: the design tokens every
component reads, a few base element styles, and one accessibility helper
class. The theme is a light-mode SAP Fiori "Morning Horizon" look at a 14px
base size, but the token names are generic (`--color-primary`, not
`--sapBrandColor`), so you can swap in any palette.

| File | Contains |
| --- | --- |
| `tokens.css` | All design tokens, as custom properties on `:root`. Values only, no selectors. |
| `base.css` | Element defaults: box-sizing, `body`, headings, links, bare `<button>`s, the focus ring, reduced motion. |
| `a11y.css` | `.erp-visually-hidden` |
| `index.css` | Imports the three above, in that order. |

## How to use it

Import it once, at the top of your entry file:

```tsx
import './erp-ui-components/styles/index.css'
```

Use the tokens in your own CSS so your screens match the components:

```css
.po-card {
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  padding: var(--space-5);
}

.po-eyebrow {
  color: var(--color-text-muted);
  font-size: var(--text-xs);
  font-weight: var(--weight-semibold);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
}
```

Use `.erp-visually-hidden` to hide text visually but keep it for screen
readers:

```tsx
<button><TrashIcon /><span className="erp-visually-hidden">Delete item 10</span></button>
```

### If your app already has a CSS reset

`base.css` styles `body`, headings, links and plain `<button>`s. If that
conflicts with your own styles, you can import `tokens.css` and `a11y.css`
directly instead of `index.css`. If you do, keep these two rules from
`base.css` somewhere, because the components rely on them:

```css
:focus-visible {
  outline: 2px solid var(--color-focus-ring);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

Some components (the table's sort buttons, the pager, the sidebar) also build
on `base.css`'s `<button>` reset, so check them if you drop it.

## How to customize

Override any token after the theme loads. See
[customization.md](./customization.md) for global, scoped and dark-theme
examples.

```css
:root {
  --color-primary: #7c3aed;
  --font-sans: "Inter", Arial, sans-serif;
}
```

Or replace `tokens.css` with your own file defining the same names.

### Design rules the defaults follow

Keep these in mind when you change colours, so the UI still reads correctly:

1. One blue means "you can act on this". Links, the focus ring, button labels
   and field hover lines all use the primary family. Nothing decorative is
   blue.
2. Fields are filled, not outlined. A field (`--color-surface-sunken`) is
   darker than the card (`--color-surface`), which is lighter than the page
   (`--color-bg`). Keep that order.
3. State is never shown by colour alone. Invalid fields also get a thicker
   line and a message; required fields get an asterisk; changed grid rows get
   a `*` or `+`.
4. Red is only for errors and destructive actions. Required fields use
   magenta (`--color-required`), and the chart palette has no red.

## Token reference

### Brand and interaction

| Token | Default | Used for |
| --- | --- | --- |
| `--color-primary` | `#0070f2` | emphasized button, sort arrows, active grid cell, chart series 1 |
| `--color-primary-hover` | `#0064d9` | hover, default button text |
| `--color-primary-active` | `#0058bf` | pressed, sorted header text |
| `--color-primary-soft` | `#e1f4ff` | selected rows and cells, sorted header |
| `--color-primary-soft-hover` | `#cfe9ff` | selected + hovered |
| `--color-primary-muted` | `#80b8f8` | disabled brand colour |
| `--color-on-primary` | `#ffffff` | text on a filled primary button |

### Secondary and tertiary

| Token | Default |
| --- | --- |
| `--color-secondary` | `#5b738b` |
| `--color-secondary-hover` | `#46596d` |
| `--color-secondary-soft` | `#eff1f2` |
| `--color-on-secondary` | `#ffffff` |
| `--color-tertiary` | `#6c32a9` |
| `--color-tertiary-hover` | `#56287f` |
| `--color-tertiary-soft` | `#f2e5ff` |
| `--color-on-tertiary` | `#ffffff` |

These aren't used by the components for interaction. They're available for
badges, meta text and accents in your own screens.

### Status

Each state has a text colour (readable on white), a border colour (for lines
and icons) and a soft background.

| State | Text | Border | Soft |
| --- | --- | --- | --- |
| success | `--color-success` `#256f3a` | `--color-success-border` `#2b7d42` | `--color-success-soft` `#f5fae5` |
| warning | `--color-warning` `#b44f00` | `--color-warning-border` `#dd6100` | `--color-warning-soft` `#fff8d6` |
| danger | `--color-danger` `#aa0808` | `--color-danger-border` `#e90b0b` | `--color-danger-soft` `#ffeaf4` |
| info | `--color-info` `#0064d9` | `--color-info-border` `#0070f2` | `--color-info-soft` `#e1f4ff` |

Also: `--color-danger-hover` `#8f0606` (negative button hover),
`--color-neutral` `#788fa6`, `--color-neutral-soft` `#eff1f2`.

### Surfaces

| Token | Default | Used for |
| --- | --- | --- |
| `--color-bg` | `#f5f6f7` | page background |
| `--color-surface` | `#ffffff` | cards, dialogs, tables |
| `--color-surface-alt` | `#f5f6f7` | zebra stripes, read-only grid cells |
| `--color-surface-sunken` | `#eff1f2` | field fill, table headers |

### Text

| Token | Default | Used for |
| --- | --- | --- |
| `--color-text` | `#131e29` | body text |
| `--color-text-muted` | `#556b82` | labels, captions |
| `--color-text-subtle` | `#758ca4` | hints, placeholders |
| `--color-text-inverse` | `#ffffff` | text on dark fills |
| `--color-link` | `var(--color-primary-hover)` | links |

### Lines and focus

| Token | Default | Used for |
| --- | --- | --- |
| `--color-border` | `#e5e5e5` | hairlines, table rows |
| `--color-border-strong` | `#bcc3ca` | button borders, frames, header lines |
| `--color-field-border` | `#556b81` | field underline |
| `--color-divider` | `#a8b3bd` | group dividers |
| `--color-focus-ring` | `#0032a5` | keyboard focus outline |
| `--color-required` | `#ba066c` | required asterisk |

### App chrome (sidebar)

| Token | Default |
| --- | --- |
| `--color-chrome-bg` | `#ffffff` |
| `--color-chrome-bg-elevated` | `#ffffff` |
| `--color-chrome-fg` | `#131e29` |
| `--color-chrome-fg-muted` | `#556b82` |
| `--color-chrome-hover` | `#eaecee` (also used for hover on buttons, headers and rows) |
| `--color-chrome-border` | `#d9d9d9` |
| `--color-chrome-active` | `#0058bf` |

### Charts

| Token | Default |
| --- | --- |
| `--chart-1` … `--chart-8` | `#0070f2` blue, `#6c32a9` purple, `#2b7d42` green, `#dd6100` orange, `#5b738b` slate, `#047d7a` teal, `#ba066c` magenta, `#4a4ecc` indigo |
| `--chart-gridline` | `#e5e5e5` |
| `--chart-axis` | `#bcc3ca` |
| `--chart-label` | `#556b82` |

### Elevation, radius and spacing

| Token | Default |
| --- | --- |
| `--shadow-sm` | cards, sticky form actions |
| `--shadow-md` | combobox popup, chart tooltip |
| `--shadow-lg` | dialogs |
| `--radius-sm` | `0.25rem` (fields, tables) |
| `--radius-md` | `0.5rem` (buttons) |
| `--radius-lg` | `0.75rem` (cards, dialogs) |
| `--radius-pill` | `999px` |
| `--space-1` … `--space-6` | `0.25rem`, `0.5rem`, `0.75rem`, `1rem`, `1.5rem`, `2rem` |
| `--space-8` | `3rem` (there's no `--space-7`) |

### Typography

| Token | Default |
| --- | --- |
| `--font-sans` | `"72", "72full", Arial, Helvetica, sans-serif` |
| `--font-mono` | `"72Mono", "72Monofull", "SFMono-Regular", ui-monospace, Consolas, monospace` |
| `--text-xs` / `-sm` / `-md` / `-lg` / `-xl` / `-2xl` | `0.6875rem` / `0.75rem` / `0.875rem` (base, 14px) / `1rem` / `1.125rem` / `1.375rem` |
| `--weight-normal` / `-medium` / `-semibold` / `-bold` | `400` / `500` / `600` / `700` |
| `--leading-tight` / `-normal` | `1.25` / `1.5` |
| `--tracking-tight` / `-wide` | `-0.011em` / `0.06em` |

"72" is SAP's font and isn't bundled. Users without it see Arial. To use your
own font, load it (for example with `@font-face`) and set `--font-sans`.

### Control metrics and motion

| Token | Default | Used for |
| --- | --- | --- |
| `--control-height` | `2.25rem` (36px) | inputs and buttons |
| `--control-height-compact` | `1.625rem` (26px) | compact density |
| `--control-padding-x` | `0.625rem` | padding inside fields |
| `--form-label-width` | `10rem` | label column in `beside` forms |
| `--transition-fast` | `120ms ease` | hover, small changes |
| `--transition` | `200ms ease` | dialog open/close |

`tokens.css` also sets `color-scheme: light` on `:root`.

## What `base.css` does

- `box-sizing: border-box` on everything.
- `body`: no margin, full height, `--color-bg` background, `--font-sans` at
  `--text-md`.
- Headings: bold, tight leading, no top margin. `h1` `--text-2xl`, `h2`
  `--text-xl`, `h3` `--text-lg`, `h4`–`h6` `--text-md`.
- Links: `--color-link`, underlined on hover and focus.
- Bare `<button>`: looks like the default button (white, grey border, blue
  text, `--control-height` tall).
- `:focus-visible`: 2px `--color-focus-ring` outline.
- `prefers-reduced-motion`: turns off animations and transitions.
