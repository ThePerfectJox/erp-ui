# Chart

## What it is

Three charts drawn in SVG, with no chart library: `BarChart`, `LineChart` and
`DonutChart`. They take their colours and fonts from the same design tokens as
everything else, so they match the rest of the screen.

| Question | Chart |
| --- | --- |
| How do these categories compare? | `BarChart` |
| What's the trend over time? | `LineChart` |
| What are the parts of this whole? (3–6 parts) | `DonutChart` |

All three:

- fill the width of their container and resize with it,
- show a tooltip on hover,
- draw `null` values as gaps, not zeros,
- render their data as a visually hidden table, so screen readers get every
  value, not just a picture.

```tsx
import { BarChart, LineChart, DonutChart } from './erp-ui-components/chart'
import type { ChartSeries, ChartSlice } from './erp-ui-components/chart'
```

## How to use it

### The data shape

Bar and line charts take `categories` (the x-axis labels) and `series` (one
object per line or bar colour, with one value per category):

```ts
interface ChartSeries {
  key: string                       // stable id
  label: string                     // name in the legend and tooltip
  values: readonly (number | null)[] // one per category; null = no data
  color?: string                    // optional, overrides the palette
}
```

A series shorter than `categories` is treated as having gaps at the end, so a
year-to-date series can sit next to a full-year plan.

The donut takes `slices`:

```ts
interface ChartSlice {
  key: string
  label: string
  value: number     // must not be negative
  color?: string
}
```

### `BarChart`

```tsx
<BarChart
  caption="Ordered against received"
  description="Units per month, current year"
  categories={['Jan', 'Feb', 'Mar', 'Apr']}
  series={[
    { key: 'ordered', label: 'Ordered', values: [120, 140, 95, 160] },
    { key: 'received', label: 'Received', values: [118, 140, 95, null] },
  ]}
  formatValue={value => `${value} EA`}
/>
```

Series are drawn side by side. Pass `isStacked` to stack them instead (in
stacked mode, negative values are treated as 0). The value axis always starts
at zero, because a bar's length is its value.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `categories` | `readonly string[]` | | Required. Axis labels, left to right. |
| `series` | `readonly ChartSeries[]` | | Required. |
| `isStacked` | `boolean` | | Stack series instead of grouping them. |
| `categoryHeader` | `string` | `'Category'` | Header of the first column in the hidden data table. |
| `height` | `number` | `240` | Plot height in px. |

Plus the [shared props](#shared-props).

### `LineChart`

```tsx
<LineChart
  caption="Cumulative net value"
  categories={['00010', '00020', '00030', '00040']}
  series={[{ key: 'total', label: 'Running total', values: [2208, 2616, 2845, 2900] }]}
  isArea
  hasMarkers
  formatValue={value => EURO.format(value)}
/>
```

Points are joined with straight lines. A `null` breaks the line.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `categories` | `readonly string[]` | | Required. Usually time periods. |
| `series` | `readonly ChartSeries[]` | | Required. |
| `isArea` | `boolean` | | Fills the area under the line. Use with a single series. |
| `hasMarkers` | `boolean` | | A dot on every point. Good for short series. |
| `isZeroBased` | `boolean` | `true` | Set `false` to fit the axis to the data (exchange rates, temperatures). |
| `categoryHeader` | `string` | `'Category'` | |
| `height` | `number` | `240` | |

Plus the [shared props](#shared-props).

### `DonutChart`

```tsx
<DonutChart
  caption="Net value by material group"
  slices={[
    { key: 'raw', label: 'Raw material', value: 2208 },
    { key: 'hardware', label: 'Hardware', value: 408 },
    { key: 'packaging', label: 'Packaging', value: 229 },
  ]}
  totalLabel="Net total"
  formatValue={value => EURO.format(value)}
/>
```

Slices go clockwise from 12 o'clock in the order given; sort them largest
first. The legend shows each slice's value and percentage. With more than six
slices, use a bar chart.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `slices` | `readonly ChartSlice[]` | | Required. |
| `innerRadiusRatio` | `number` | `0.62` | Hole size, 0 to 0.9. `0` draws a pie. |
| `totalLabel` | `string` | | Shows the total in the centre, with this label under it. |
| `legendPlacement` | `'right' \| 'bottom' \| 'none'` | `'right'` | `'right'` switches to `'bottom'` below 520px. |
| `categoryHeader` | `string` | `'Category'` | |
| `height` | `number` | `220` | |

Plus the [shared props](#shared-props), except `legendPlacement`, which the
donut redefines.

Negative slice values are drawn as 0 (and excluded from the total and
percentages), but shown as-is in the legend and table. If all values are 0, an
empty ring is drawn.

### Shared props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `caption` | `string` | | Required. Title above the chart and caption of the hidden data table. |
| `isCaptionHidden` | `boolean` | | Hides the caption visually. |
| `description` | `string` | | A line under the caption. |
| `height` | `number` | per chart | Plot height in px, not counting caption and legend. |
| `legendPlacement` | `'top' \| 'bottom' \| 'none'` | `'bottom'` | |
| `formatValue` | `(value: number) => string` | see below | Formats numbers on the axis, in tooltips, legend and data table. |
| `className` | `string` | | Added to the `<figure class="chart">`. |

Number formatting by default: the axis uses a compact form (`1200`, `12.5k`,
`3.4m`, `2.1bn`), and everything else uses the full number in the browser's
locale with up to 2 decimals (`1,234.5`). When you pass `formatValue`, it's
used everywhere, including the axis.

### Sizing

Charts are as wide as their container and redraw when it resizes. Put two side
by side with CSS grid:

```css
.chart-pair {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 20rem), 1fr));
  gap: var(--space-5);
}
```

Height is fixed by the `height` prop.

### Tooltips

Hovering a category (bar and line charts) or a slice (donut) shows a tooltip
and dims the other bars. Tooltips are mouse-only; keyboard and screen reader
users get the values from the hidden data table.

## How to customize

### Colours

Series and slices use the palette `--chart-1` to `--chart-8`, in order
(series 9 starts again at `--chart-1`).

To give one series a meaning, set its `color`. Any CSS colour works,
including tokens:

```tsx
series={[
  { key: 'plan', label: 'Plan', values: plan, color: 'var(--color-neutral)' },
  { key: 'overrun', label: 'Over budget', values: overrun, color: 'var(--color-danger-border)' },
]}
```

To change the palette for one chart, override the variables through
`className`:

```css
.status-chart {
  --chart-1: var(--color-success-border);
  --chart-2: var(--color-warning-border);
  --chart-3: var(--color-danger-border);
}
```

```tsx
<DonutChart className="status-chart" … />
```

To change it for the whole app, override them on `:root` (see
[customization.md](./customization.md)).

### Chart variables

| Variable | Default | Used for |
| --- | --- | --- |
| `--chart-1` … `--chart-8` | blue, purple, green, orange, slate, teal, magenta, indigo | series colours |
| `--chart-gridline` | `#e5e5e5` | horizontal gridlines |
| `--chart-axis` | `#bcc3ca` | zero line, line-chart hover guide |
| `--chart-label` | `#556b82` | axis labels |

Other tokens used: `--color-text`, `--color-text-muted`, `--color-text-subtle`
(caption, legend, donut total), `--color-surface` (marker and slice outlines,
tooltip), `--color-border-strong` and `--shadow-md` (tooltip), `--font-sans`.

### CSS classes

```text
figure.chart(.chart-donut-beside)              ← className
  figcaption.chart-caption
  p.chart-description
  ul.chart-legend.chart-legend-top             legendPlacement="top"
  div.chart-plot                               height set inline
    svg.chart-svg
      line.chart-gridline / line.chart-baseline
      text.chart-axis-label.chart-axis-label-value / -category
      rect.chart-bar(.chart-bar-dimmed)        BarChart
      path.chart-line, path.chart-area, circle.chart-point(.chart-point-active)   LineChart
      line.chart-hover-guide                   LineChart
      path.chart-slice(.chart-slice-active)    DonutChart
      g.chart-donut-centre > text.chart-donut-total + text.chart-donut-total-label
      rect.chart-hover-band(.chart-hover-band-active)
    div.chart-tooltip
      p.chart-tooltip-title
      ul.chart-tooltip-rows > li.chart-tooltip-row
        span.chart-tooltip-swatch, span.chart-tooltip-label, span.chart-tooltip-value
  ul.chart-legend.chart-legend-bottom
    li.chart-legend-item
      span.chart-legend-swatch, span.chart-legend-label
      span.chart-legend-value > span.chart-legend-share     DonutChart only
  table.chart-data-table                       visually hidden
```

Series colours are SVG `fill`/`stroke` attributes, so any CSS rule overrides
them. Legend and tooltip swatch colours are inline styles; change them through
`color` or the `--chart-N` variables instead.

Examples:

```css
/* Thicker lines */
.trend-chart .chart-line { stroke-width: 3; }

/* No gridlines */
.trend-chart .chart-gridline { display: none; }

/* Stronger area fill */
.trend-chart .chart-area { opacity: 0.3; }

/* Larger legend text */
.trend-chart .chart-legend { font-size: var(--text-md); }

/* A thinner donut ring is a prop: innerRadiusRatio={0.8} */
```

Fixed values: SVG text is 11px, line width 2, markers have radius 3 (4.5 when
hovered), dimmed bars are at 35% opacity. All but the marker radius can be
overridden with CSS.

## Building blocks

The pure functions the charts are made from, for building a chart type the
library doesn't have (sparkline, bullet chart, scatter) that still looks the
same.

| Export | Signature | Description |
| --- | --- | --- |
| `linearScale` | `({ values, height, tickCount = 5, isZeroBased = true }) => { min, max, ticks, positionOf(v), lengthOf(v) }` | Value axis with "nice" ticks. |
| `bandScale` | `({ count, width, padding = 0.25 }) => { step, bandWidth, startOf(i), centreOf(i), indexAt(x) }` | Category axis. |
| `plotAreaFor` | `({ width, height, valueLabels, hasCategoryAxis = true }) => { left, top, width, height }` | Plot area inside the SVG, leaving room for labels. |
| `labelStride` | `(count, width, minLabelWidth = 48) => number` | Show every nth category label so they don't overlap. |
| `linePath` | `(points) => string` | SVG path `d` for a line. |
| `areaPath` | `(points, baselineY) => string` | SVG path `d` for an area. |
| `toSegments` | `(points with nulls) => PlotPoint[][]` | Splits a line at gaps. |
| `donutSlicePath` | `(cx, cy, outerR, innerR, startAngle, endAngle) => string` | One donut/pie wedge. Angles in radians, 0 at 12 o'clock. |
| `polarPoint` | `(cx, cy, radius, angle) => { x, y }` | |
| `stackValues`, `stackTotals` | `(series, categoryCount)` | Stacked segment positions and column totals. |
| `seriesColor` | `(index, explicitColor?) => string` | `explicitColor` or `var(--chart-N)`. |
| `formatCompact`, `formatFull`, `formatShare` | | The default number formats. `formatShare(value, total)` gives `"4.5%"` / `"45%"`. |
| `useElementWidth` | `(ref) => number` | Measured width of an element, updated on resize. Starts at `FALLBACK_CHART_WIDTH` (640). |

Example: a sparkline.

```tsx
import { useRef } from 'react'
import { linePath, linearScale, seriesColor, toSegments, useElementWidth } from './erp-ui-components/chart'

function Sparkline({ values, label }: { values: (number | null)[]; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const width = useElementWidth(ref)
  const height = 32
  const scale = linearScale({ values: values.filter((v): v is number => v !== null), height, isZeroBased: false })
  const step = width / Math.max(values.length - 1, 1)
  const points = values.map((value, index) => (value === null ? null : { x: index * step, y: scale.positionOf(value) }))

  return (
    <div ref={ref} role="img" aria-label={label}>
      <svg width={width} height={height} aria-hidden="true">
        {toSegments(points).map((segment, index) => (
          <path key={index} d={linePath(segment)} fill="none" stroke={seriesColor(0)} strokeWidth={1.5} />
        ))}
      </svg>
    </div>
  )
}
```

Types: `ChartBaseProps`, `ChartSeries`, `ChartSlice`, `ChartValue`,
`ChartValueFormatter`, `ChartLegendPlacement`, `LinearScale`, `BandScale`,
`PlotArea`, `PlotPoint`, `StackSegment`.

## Limits

No scatter plots, dual axes, zoom, animation on data change or 100%-stacked
mode. Tooltips don't work with keyboard or touch.
