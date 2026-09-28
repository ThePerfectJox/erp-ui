# `chart/` — bar, line and donut charts

Three charts, hand-drawn in SVG with no charting library. A library would bring a
second design system with it — its own colours, type, tooltips and accessibility
story — and then every chart would be an argument between the two. These take
their palette and type from the [tokens](./styles.md) like everything else.

```tsx
import { BarChart, LineChart, DonutChart } from './erp-ui-components/chart'
import type { ChartSeries, ChartSlice } from './erp-ui-components/chart'
```

## Choosing one

| Question | Chart |
| --- | --- |
| How do these categories compare? | `BarChart` |
| What is the trend over time? | `LineChart` |
| What are the parts of this whole? | `DonutChart`, for three to six parts |

All three take the same base props, so learning one teaches the others.

## Two things all three do

- **A `null` is a gap, never a zero.** Bars skip it, lines break at it, the data
  table reads it as an em dash. "No goods receipt yet" and "received none" are
  different claims and a chart shouldn't merge them.
- **Every chart renders its data as a real, visually-hidden table.** The SVG is
  `aria-hidden`; a screen reader gets a caption, headers and every value in
  something navigable — a deliberate choice over the usual `role="img"` plus a
  one-line summary that satisfies an audit and hands over none of the content.

## The shared data contract

Charts are **series-oriented**: categories along the axis once, then one object
per series holding a value for each.

```ts
type ChartValue = number | null   // null is a gap, not a zero

interface ChartSeries {
  key: string      // stable identity — React key + legend
  label: string    // what the legend and tooltip call it
  values: readonly ChartValue[]  // one per category, same order
  color?: string   // overrides the palette; use it when colour means something
}

interface ChartSlice {   // one donut wedge; part-to-whole has no axis
  key: string
  label: string
  value: number    // must not be negative — negatives are dropped from the drawing
  color?: string
}
```

## `ChartBaseProps` — props every chart takes

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `caption` | `string` | — | **required**; names the chart and captions the accessible table |
| `isCaptionHidden` | `boolean` | | hides the caption visually |
| `description` | `string` | | a line under the caption |
| `height` | `number` | per chart | plot height in px, excluding caption and legend |
| `legendPlacement` | `ChartLegendPlacement` | `'bottom'` | `'top' \| 'bottom' \| 'none'` |
| `formatValue` | `(value: number) => string` | compact | how numbers are written; one function for axis, tooltip and table so they can't disagree |
| `className` | `string` | | |

## `BarChart`

Adds to the base:

| Prop | Type | Notes |
| --- | --- | --- |
| `categories` | `readonly string[]` | axis labels, left to right |
| `series` | `readonly ChartSeries[]` | grouped side by side, or stacked |
| `isStacked` | `boolean` | stacks instead of grouping |
| `categoryHeader` | `string` | heading for the category column in the accessible table; default `"Category"` |

Default height 240.

**The axis always includes zero, and that is not configurable.** A bar's meaning
is its length, so an axis starting at 90 would draw 100 as ten times the height
of 91 — the most effective way to mislead with a chart.

```tsx
<BarChart
  caption="Ordered against received"
  categories={['Jan', 'Feb', 'Mar', 'Apr']}
  series={[
    { key: 'ordered',  label: 'Ordered',  values: [120, 140, 95, 160] },
    { key: 'received', label: 'Received', values: [118, 140, 95, null] },
  ]}
  formatValue={value => `${value} EA`}
/>
```

## `LineChart`

Adds to the base:

| Prop | Type | Notes |
| --- | --- | --- |
| `categories` | `readonly string[]` | usually time |
| `series` | `readonly ChartSeries[]` | |
| `isArea` | `boolean` | fills under the line — **single series only** (two areas hide each other) |
| `hasMarkers` | `boolean` | a dot at every point; good for short series |
| `isZeroBased` | `boolean` | default `true`; set false to let the axis start elsewhere |
| `categoryHeader` | `string` | default `"Category"` |

Default height 240.

Straight segments, no curve fitting (a spline invents values for dates never
measured and can overshoot below zero). A `null` breaks the line rather than
being joined across. Unlike a bar chart, `isZeroBased` can be turned off here —
a line's *slope* carries the meaning, so forcing an exchange rate onto a
zero-based axis would flatten it into a meaningless horizontal line.

## `DonutChart`

Part-to-whole, as a ring. It omits `legendPlacement` from the base and redefines
it, and adds:

| Prop | Type | Notes |
| --- | --- | --- |
| `slices` | `readonly ChartSlice[]` | wedges, clockwise from 12 o'clock |
| `innerRadiusRatio` | `number` | hole size, 0–0.9; default `0.62`; `0` draws a pie |
| `totalLabel` | `string` | wording for the figure in the middle ("Total") |
| `categoryHeader` | `string` | default `"Category"` |
| `legendPlacement` | `'right' \| 'bottom' \| 'none'` | default `'right'` |

Default height 220.

**Use it for few slices — three to six.** Past that the wedges get too thin, the
palette repeats at eight, and a bar chart answers the same question better
(people read lengths more accurately than angles). **The legend carries the
numbers** — each entry shows its value and share, because an exact figure can't
be read off an arc — which is why it defaults to sitting alongside.

```tsx
<DonutChart
  caption="Net value by material group"
  slices={[
    { key: 'raw',       label: 'Raw material', value: 2208 },
    { key: 'hardware',  label: 'Hardware',     value: 408 },
    { key: 'packaging', label: 'Packaging',    value: 229 },
  ]}
  totalLabel="Net total"
  formatValue={value => `€${value.toFixed(2)}`}
/>
```

## Types and building blocks (barrel exports)

Besides the three charts, the barrel exports the types (`ChartBaseProps`,
`ChartLegendPlacement`, `ChartSeries`, `ChartSlice`, `ChartValue`,
`ChartValueFormatter`), the `useElementWidth` hook (+ `FALLBACK_CHART_WIDTH`), and
the pure `core/` layer for building a chart this folder doesn't have — a scatter,
a bullet, a sparkline — so it comes out looking like the rest:

- **scales**: `linearScale`, `bandScale`, `plotAreaFor`, `labelStride` (+ types
  `LinearScale`, `BandScale`, `PlotArea`)
- **geometry**: `linePath`, `areaPath`, `donutSlicePath`, `polarPoint`,
  `toSegments`, `stackValues`, `stackTotals` (+ types `PlotPoint`,
  `StackSegment`)
- **format/palette**: `formatCompact`, `formatFull`, `formatShare`, `seriesColor`

## Internal parts

`CartesianPlot`, `ChartDataTable` (the accessible table), `ChartFrame` (caption +
legend + plot layout), `ChartLegend`, `ChartTooltip`. Not exported.

## What it is not

No scatter, no combo axes, no zoom or brush, no animation on data change, no
stacked-to-100% mode. The `core/` layer is exported precisely so a chart this
folder doesn't ship can be built on the same scales, paths and formatting rather
than starting over.
