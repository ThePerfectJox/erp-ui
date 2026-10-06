# Customization

You can customize erp-ui at five levels. They're listed from the least to the
most effort, so start at the top and only go further down when you need to.

1. [Props](#1-props): variants, densities, sizes, formatters, colours
2. [Design tokens](#2-design-tokens-retheme-everything): retheme the whole app
3. [Scoped tokens](#3-scoped-tokens-retheme-one-area): retheme one area or one
   component instance
4. [Component variables and CSS classes](#4-component-variables-and-css-classes):
   restyle a specific part
5. [Build your own](#5-build-your-own-component-on-the-same-primitives): a new
   component on the library's primitives

At the end there's a list of [things you can't change without editing the
source](#what-you-cant-change-without-editing-the-source).

## 1. Props

Most visual choices are props. Each module doc lists them in full. The common
ones:

| Want | Prop |
| --- | --- |
| A smaller form, with smaller buttons | `<Form density="compact">` |
| Labels in a left column | `<Form labelPlacement="beside">` |
| A different button look | `<Button variant="emphasized">` (`default`, `emphasized`, `transparent`, `positive`, `negative`) |
| A smaller button | `<Button density="compact">` |
| A tighter table | `<ViewTable density="compact">` |
| No zebra stripes | `<ViewTable hasZebraStripes={false}>` |
| A wider dialog | `<Modal size="large">` (`small`, `medium`, `large`, `full`) |
| A chart series in a specific colour | `{ key, label, values, color: 'var(--color-danger-border)' }` |
| Units or currency in a chart | `formatValue={value => `€${value.toFixed(2)}`}` |
| Different grid sizes | `<DataGrid defaultColumnWidth={120} defaultRowHeight={26}>` |
| A different empty message | `<ViewTable emptyText="No receipts posted yet">`, `<ComboBox noResultsText="…">` |

## 2. Design tokens: retheme everything

Every colour, font, size, radius, shadow and spacing value in the library is a
CSS custom property on `:root`, defined in
[`styles/tokens.css`](../src/erp-ui-components/styles/tokens.css). Components
only read tokens. Change a token and every component that uses it follows.

The full list is in [styles.md](./styles.md#token-reference).

There are two ways to change them.

Override a few tokens in your own stylesheet:

```css
/* src/theme.css */
:root {
  --color-primary: #7c3aed;
  --color-primary-hover: #6d28d9;
  --color-primary-active: #5b21b6;
  --color-primary-soft: #f3e8ff;
  --color-link: var(--color-primary-hover);
  --color-focus-ring: #4c1d95;

  --font-sans: "Inter", Arial, sans-serif;
  --radius-md: 0.25rem;
}
```

```tsx
// src/main.tsx
import './erp-ui-components/styles/index.css'
import './theme.css'   // after the library theme, so it wins
```

Or replace `tokens.css` entirely. It holds values and nothing else, so you can
swap it for a file defining the same names with different values.

### Example: a dark theme

Tokens are plain CSS, so a dark theme is a block of overrides under a selector
you control:

```css
[data-theme='dark'] {
  color-scheme: dark;

  --color-bg: #12171c;
  --color-surface: #1d232a;
  --color-surface-alt: #232a32;
  --color-surface-sunken: #29313a;

  --color-text: #eaecee;
  --color-text-muted: #a9b4be;
  --color-text-subtle: #8396a8;

  --color-border: #34404b;
  --color-border-strong: #4a5764;
  --color-field-border: #8396a8;

  --color-chrome-bg: #1d232a;
  --color-chrome-fg: #eaecee;
  --color-chrome-hover: #2c353f;
  --color-chrome-border: #34404b;
  --color-chrome-active: #6cb2ff;

  --color-primary-soft: #0b2e57;
  --chart-gridline: #34404b;
}

/* The sidebar draws its shades as black at low alpha. On a dark rail, flip them to white. */
[data-theme='dark'] .sidebar {
  --sidebar-shade-group: rgba(255, 255, 255, 0.03);
  --sidebar-shade-hover: rgba(255, 255, 255, 0.06);
  --sidebar-shade-selected: rgba(255, 255, 255, 0.11);
  --sidebar-shade-selected-hover: rgba(255, 255, 255, 0.16);
  --sidebar-line: rgba(255, 255, 255, 0.1);
}
```

```tsx
document.documentElement.dataset.theme = 'dark'
```

Check contrast for every pair you change. The default palette was picked to
meet WCAG contrast minimums, and a custom palette has to be checked again.

## 3. Scoped tokens: retheme one area

Custom properties inherit. So you can set tokens on any wrapper element and
only the components inside it change. This is the cleanest way to restyle a
single instance, because you don't need to know any class names.

```tsx
<div className="danger-zone">
  <Form>…</Form>
</div>
```

```css
.danger-zone {
  --color-primary: var(--color-danger);
  --color-primary-hover: var(--color-danger-hover);
  --color-surface-sunken: #fff5f8;   /* field fill */
}
```

Most components take a `className`, so you often don't need a wrapper:

```tsx
<BarChart className="budget-chart" … />
<Modal className="wizard-dialog" … />
```

```css
.budget-chart {
  --chart-1: #2b7d42;   /* actuals green */
  --chart-2: #bcc3ca;   /* plan grey */
}
```

Components that don't take a `className` (`FormSection`, `FormRow`,
`FormActions`, `MessageStrip`, `TablePagination`, `DataGrid`, `Layout`, the
`Sidebar` parts): wrap them in an element with your own class.

## 4. Component variables and CSS classes

### Component-level variables

A few components expose their own custom properties. These are the most
targeted knobs in the library.

| Variable | Default | Affects | Set it on |
| --- | --- | --- | --- |
| `--control-height` | `2.25rem` (36px) | height of inputs, selects, buttons | any wrapper (`Form density="compact"` sets it for you) |
| `--control-height-compact` | `1.625rem` (26px) | compact buttons, the compact density | any wrapper |
| `--control-padding-x` | `0.625rem` | horizontal padding inside fields, position of select/combobox chevrons | any wrapper |
| `--form-label-width` | `10rem` | width of the label column in `labelPlacement="beside"` forms | any wrapper |
| `--field-fill`, `--field-line`, `--field-line-width`, `--field-message-color` | from tokens | one field's fill, underline and message colour | the field itself, through its `className` (see below) |
| `--sidebar-shade-group`, `--sidebar-shade-hover`, `--sidebar-shade-selected`, `--sidebar-shade-selected-hover`, `--sidebar-line` | black at 3–16% alpha | sidebar row shading and hairlines | `.sidebar` |
| `--chart-1` … `--chart-8` | the categorical palette | series colours, in order | a chart's `className` or a wrapper |
| `--chart-gridline`, `--chart-axis`, `--chart-label` | greys | gridlines, zero line and hover guide, axis text | a chart's `className` or a wrapper |

Examples:

```css
/* A wider label column for long German field names */
.settings-form { --form-label-width: 14rem; }

/* Taller controls on a touch kiosk */
.kiosk { --control-height: 3rem; }
```

The `--field-*` variables are set on each `.form-field` element and changed by
its state classes (`.form-field-error` and so on). That's why setting them on
an outer wrapper has no effect. For one field, pass a `className` and set them
there:

```tsx
<TextInput label="Total" className="field-highlight" isReadOnly value="2,845.50" />
```

```css
.form-field.field-highlight { --field-fill: var(--color-primary-soft); }
```

For a whole area, override the tokens the `--field-*` variables are built from
(`--color-surface-sunken` for the fill, `--color-field-border` for the line)
on a wrapper instead, as in level 3.

### CSS class hooks

Every component renders stable, prefixed class names. Each module doc has a
"CSS classes" table listing them. The prefixes:

| Module | Prefix | Examples |
| --- | --- | --- |
| form | `form-` | `.form-field`, `.form-control`, `.form-button-emphasized`, `.form-combobox-popup` |
| table | `table-` | `.table-frame`, `.table-header`, `.table-row-selected`, `.table-pagination` |
| sheet | `grid-` | `.grid`, `.grid-cell-focused`, `.grid-row-number-edited` |
| chart | `chart-` | `.chart`, `.chart-bar`, `.chart-legend`, `.chart-tooltip` |
| overlay | `modal-` | `.modal`, `.modal-large`, `.modal-footer` |
| layout | `layout-`, `sidebar-` | `.layout-content`, `.sidebar-open`, `.sidebar-group` |
| styles | `erp-` | `.erp-visually-hidden` |

State is expressed through modifier classes (`-selected`, `-disabled`,
`-error`, `-active`) or ARIA attributes (`[aria-sort]`, `[aria-selected]`,
`[aria-expanded]`). No component uses `data-*` attributes for state.

#### Making your override win

Library rules are almost all single-class selectors, and component stylesheets
load when the component module is first imported. Two reliable ways to win:

- Add a parent or your own class, so your selector is more specific:

  ```css
  .orders-page .table-header { text-transform: uppercase; }
  .modal.wizard-dialog { width: 52rem; }   /* beats .modal-large */
  ```

- Or load your stylesheet after the components, for example by importing it in
  the same file that uses them, after the component imports.

Avoid `!important`. The only places you'd need it are inline styles (listed
below).

Some common class overrides, each scoped one level so it wins regardless of
load order:

```css
/* Pill-shaped buttons */
.layout .form-button { border-radius: var(--radius-pill); }

/* A wider open sidebar */
.layout .sidebar-open { width: 280px; }

/* More padding in the page content */
.layout .layout-content { padding: var(--space-6); }

/* Fade the non-hovered bars further */
.chart .chart-bar-dimmed { opacity: 0.2; }

/* A taller combobox list */
.form-combobox .form-combobox-list { max-height: 24rem; }
```

Series colours are applied as SVG `fill`/`stroke` attributes, and any CSS rule
beats an SVG attribute. So `.my-chart .chart-bar { fill: … }` works without
`!important`.

## 5. Build your own component on the same primitives

When the library doesn't have what you need, the barrels export the building
blocks the existing components are made from, so a new component looks and
behaves like the rest.

| You want | Use | Docs |
| --- | --- | --- |
| A new field control (currency pair, value-help lookup) with the standard label, hint and message | `FormField`, `useFormField`, `splitFieldProps`, `FormControlShell` | [form.md](./form.md#build-your-own-field) |
| A table with custom behaviour | `useTableSort`, `useTableSelection`, `useTablePagination`, pagination math in `core` | [table.md](./table.md#hooks-and-building-blocks) |
| Copy/paste to Excel elsewhere (an "export" button, an import screen) | `toTsv`, `fromTsv`, `toHtml`, `writeToClipboard`, `readFromClipboard` | [sheet.md](./sheet.md#building-blocks) |
| A new chart type (sparkline, bullet, scatter) | `linearScale`, `bandScale`, `linePath`, `donutSlicePath`, `seriesColor`, `formatCompact`, `useElementWidth` | [chart.md](./chart.md#building-blocks) |
| Sorting that matches the tables | `computeOrder`, `compareCellValues`, `cycleSort` | [shared.md](./shared.md) |
| Your own navigation rail | `Sidebar`, `SidebarMenu`, `SidebarSubMenu`, `useSidebar` | [layout.md](./layout.md#building-a-custom-rail) |

## What you can't change without editing the source

Being upfront about the limits saves you a debugging session.

### Inline styles

These are set as inline `style` attributes, so CSS can't override them without
`!important`. Use the prop instead.

| Component | Inline style | Use instead |
| --- | --- | --- |
| `DataGrid` | column widths, row heights, table width, cell `text-align`, scroll `max-height` | `GridColumn.width`, `defaultColumnWidth`, `defaultRowHeight`, `GridColumn.align`, `maxBodyHeight` |
| `ViewTable` | header `width`, cell `text-align`, scroll `max-height` | `TableColumn.width`, `TableColumn.align`, `maxHeight` |
| Charts | plot `height`, legend and tooltip swatch colours | `height`, `series[].color` / `slices[].color`, or `--chart-N` |

### Fixed values

- The `DataGrid` row-number gutter is 48px in both the component and the CSS
  (`.grid-corner { width: 3rem }`). Changing one without the other misaligns
  the grid.
- Sidebar widths are literal (240px open, 48px closed). The open width is safe
  to override. The closed width depends on the icon padding, so leave it.
- Chart text in the SVG is fixed at 11px.
- Modal size widths are literal rems (28, 40, 64). Override them with a
  `className`, as shown above.

### Built-in English text

These strings are hard-coded. Translating them means editing the component.

| Component | Text | Configurable alternative |
| --- | --- | --- |
| `TablePagination` | "Previous", "Next", "Page 2 of 7", "21–40 of 137" | `rowNoun` appends a noun to the range |
| `ViewTable` | "Select all rows on this page", "Select row N", hidden "Selected" | `getRowLabel` replaces "row N"; `emptyText` |
| `DataGrid` | "No items", "Changed, not yet saved", "Added, not yet saved" | none |
| `Modal` | close button label "Close" | none |
| `ComboBox` | clear button label "Clear {label}" | `noResultsText` |
| `MessageStrip` | prefixes "Error:", "Warning:", "Success:", "Information:" | none |
| `Sidebar` | toggle labels "Collapse menu", "Expand menu" | none |
| Charts | data-table header "Category", donut "Value" / "Share" | `categoryHeader` |

### Other limits

- `Layout` always starts with the rail closed and has no prop to change that.
  Compose `Sidebar` yourself (see [layout.md](./layout.md#building-a-custom-rail)).
- `Layout`'s links use `react-router-dom`. For a different router, rewrite
  `layout/Sidebar/SidebarSubMenu.tsx` (about 20 lines).
- `ComboBox`, `RadioGroup` and `CheckboxGroup` don't pass native attributes
  (`onBlur`, `data-*`, `autoFocus`) through to their inputs.
