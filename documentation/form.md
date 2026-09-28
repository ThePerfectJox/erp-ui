# `form/` — controls, the form shell, and the field system

Twelve controls plus the structure to lay them out. Every field renders its own
label, hint and value-state message, so a hint sits in the same place and a
message reads the same way on every field in the app.

```tsx
import {
  Form, FormSection, FormRow, FormActions, MessageStrip,
  TextInput, NumberInput, DateInput, TextArea,
  Select, ComboBox, RadioGroup, CheckboxGroup, Checkbox, Switch, FileInput,
  Button,
} from './erp-ui-components/form'
```

## The five layers

Dependencies point strictly inward:

```text
form/
  core/        pure logic — types, prop splitting, matching, file sizes. No React.
  hooks/       useFormField (public), useComboBox (internal)
  parts/       FormField, FormControlShell (public); ChoiceList, ReadOnlySubmitValue,
               HighlightedLabel (internal)
  controls/    the twelve controls
  structure/   Form, FormSection, FormRow, FormActions, MessageStrip
  styles/      the CSS
```

## The shared foundation

Every field control opens with the same three lines, which is what makes them
interchangeable:

```tsx
function TextInput(props: TextInputProps) {
  const [field, nativeProps] = splitFieldProps(props)      // core/fieldProps.ts
  const { fieldProps, controlProps } = useFormField(field) // hooks/useFormField.ts
  return (
    <FormField {...fieldProps}>                             {/* parts/FormField.tsx */}
      <input {...nativeProps} {...controlProps} className="form-control" />
    </FormField>
  )
}
```

- **`splitFieldProps(props)`** returns `[FieldBaseProps, nativeProps]` —
  separating the shared field props from native DOM props so nothing meant for
  the field wrapper leaks onto the DOM node.
- **`useFormField(field)`** turns the shared props into a unique id, the ARIA
  attributes tying the control to its label/hint/message, and the styling flags.
- **`FormField`** draws all the chrome (label, required marker, hint, message).

### `FieldBaseProps` — the props every control accepts

`label` is the only required prop. Kept as one interface so the set cannot drift
between controls.

| Prop | Type | Notes |
| --- | --- | --- |
| `label` | `string` | **required** — an unlabelled input is unusable with a screen reader |
| `name` | `string` | submitted with the form |
| `id` | `string` | overrides the generated id; usually leave it off |
| `hint` | `string` | always-visible help text under the control |
| `valueState` | `FieldValueState` | `'error' \| 'warning' \| 'success' \| 'information'` |
| `valueStateMessage` | `string` | pair it with `valueState` |
| `isRequired` | `boolean` | asterisk on the label + `required` on the control |
| `isDisabled` | `boolean` | |
| `isReadOnly` | `boolean` | value still reads and submits, but can't be edited |
| `isLabelHidden` | `boolean` | hides the label visually, keeps it for AT |
| `labelPlacement` | `FieldLabelPlacement` | `'above' \| 'beside'`; overrides the form |
| `className` | `string` | extra classes on the field wrapper |

Only `aria-invalid` is set for `valueState: 'error'` — warning, success and
information are not invalid, and marking them so would cry wolf.

## `core/`

### `types.ts` — the shared vocabulary

- `FieldValueState = 'error' | 'warning' | 'success' | 'information'`
- `FieldLabelPlacement = 'above' | 'beside'`
- `FieldDensity = 'cozy' | 'compact'`
- `ChoiceOrientation = 'vertical' | 'horizontal'`
- `FieldAdornment = string | ReactNode` — a `string` is an image URL (what an
  `.svg` import resolves to); anything else renders as-is
- `FieldBaseProps` (above)
- `FieldOption = { value: string; label: string; description?: string; isDisabled?: boolean }`
- Passthrough prop types (`PassthroughInputProps`, `PassthroughTextAreaProps`,
  `PassthroughSelectProps`) — native attributes minus the ones the field manages
- The three contracts `useFormField` produces: `FormFieldChromeProps`,
  `FormControlProps`, `FormGroupProps`

### `fieldProps.ts`

- `splitFieldProps<T>(props): [FieldBaseProps, Omit<T, keyof FieldBaseProps>]`
- `extractReadOnly(controlProps): [NonNativeReadOnlyProps, boolean]` — strips
  `readOnly` and adds `aria-readonly`. `readOnly` is only valid HTML on a text
  `<input>` and a `<textarea>`; on a `<select>` React warns, and on a checkbox or
  file input the browser silently ignores it. Four controls (Checkbox, Switch,
  Select, FileInput) run through this. Whether to *also* disable is each
  control's decision, not this helper's.

### `fileSize.ts` — `formatFileSize(bytes): string`

1024-based, one decimal below 10 (`9.4 MB`), none above (`94 MB`), units
`B/kB/MB/GB`. Used by `FileInput`.

### `comboBoxMatching.ts`

- `ComboBoxFilter = (option: FieldOption, query: string) => boolean`
- `matchLabelOrValue` — the default filter: case-insensitive substring on label
  or value
- `findSelectableIndex(options, start, step)` — wraps, skips disabled, returns
  `-1` if all disabled
- `findMatchRange(label, query)` — the run of characters to highlight

## `hooks/`

### `useFormField(props: FieldBaseProps): UseFormFieldResult` (public)

Returns:

```ts
{
  fieldProps: FormFieldChromeProps  // spread onto <FormField>
  controlProps: FormControlProps    // spread onto the native control
  groupProps: FormGroupProps        // spread onto a <fieldset> instead
  controlId: string
  isInvalid: boolean                // valueState === 'error'
}
```

`aria-describedby` points at the hint and message *only when they are rendered*
(hint first, then message). The id comes from `props.id` or a `useId()` fallback.

### `useComboBox(...)` (internal)

The state machine behind `ComboBox`: open/close, the typed draft versus the
committed selection, the highlighted option (an index, announced via
`aria-activedescendant`, not real DOM focus), the keyboard map, and the
commit-or-revert resolution that runs on blur. The value is always constrained to
the list — free text is never kept. Not exported from the module barrel.

## `parts/`

### `FormField` (public)

Everything around a control: label, required marker, hint, value-state message.
No control renders its own label — they all hand that job here.

`FormFieldVariant = 'stacked' | 'inline' | 'group'`:
- `stacked` (default) — `<label for>` above or beside the control
- `inline` — the `<label>` wraps the control, extending the hit area (Checkbox,
  Switch)
- `group` — `<fieldset>` + `<legend>`, for RadioGroup and CheckboxGroup

Props are `FormFieldChromeProps` plus `variant?`, `groupProps?`,
`children: ReactNode`, and `addon?` (extra chrome under the control but above the
messages — a character counter, a chosen-files list).

### `FormControlShell` (public)

Wraps a control so fixed text sits inside the field box — a `€` prefix, a `kg`
suffix. Props: `{ prefix?: FieldAdornment; suffix?: FieldAdornment; children }`.
A `string` affix is rendered as **text** here (not as a URL — that asymmetry with
`Button`'s `logo` is deliberate: a field affix is a unit, a button mark is an
icon). Used by `TextInput` and `NumberInput`.

### Internal parts (not exported)

- **`ChoiceList`** — the option list shared by RadioGroup and CheckboxGroup
  (`type: 'radio' | 'checkbox'`). Both were rendering the same 35 lines; sharing
  them keeps the id convention from drifting.
- **`ReadOnlySubmitValue`** — a hidden `<input>` that keeps a read-only (hence
  disabled) checkable control's value in the submitted form. Used by Checkbox and
  Switch.
- **`HighlightedLabel`** — marks the matched run in a combobox row with `<mark>`.

## `controls/` — the twelve controls

All extend `FieldBaseProps` (so they inherit every prop in the table above)
**except `Button`**. All are default exports, re-exported from the barrel.

### Text-like inputs

- **`TextInput`** — adds `type?: TextInputType` (`'text' | 'email' | 'password'
  | 'tel' | 'url' | 'search'`), `prefix?`, `suffix?` (via `FormControlShell`),
  plus `PassthroughInputProps`. Uncontrolled by default; controllable with
  `value` + `onChange`.
- **`NumberInput`** — adds `unit?` (rendered as a suffix), `prefix?`,
  `isTextAligned?` (off = right-aligned digits), plus `min`/`max`/`step` from the
  passthrough. Sets `type="number"`, `inputMode="decimal"`. `event.target.value`
  is a string.
- **`TextArea`** — adds `rows?` (default 3), `hasCounter?` (needs `maxLength`;
  shows `used / limit` in the `addon` slot).
- **`DateInput`** — adds `type?: DateInputType` (`'date' | 'time' |
  'datetime-local' | 'month' | 'week'`, default `'date'`). Values are ISO 8601
  strings.

### Choice controls

- **`Select`** — `options: readonly FieldOption[]`, `placeholder?`. A native
  `<select>` with a separate chevron. Read-only keeps a real focusable/submitting
  select and filters the options down to the chosen one.
- **`ComboBox`** — a searchable dropdown. `options`, `value?` (controlled),
  `defaultValue?`, `onChange?: (value: string) => void`, `placeholder?`,
  `noResultsText?` (default `'No matches found'`), `filter?` (default
  `matchLabelOrValue`), `isClearable?`. Submits a hidden input carrying the
  option's **value**, not its label. Keyboard: `↓/↑` open or move; `Home/End`
  first/last; `Enter` takes the highlighted option (or submits the form when
  nothing is highlighted); `Tab` takes it and moves on; `Esc` reverts.
- **`RadioGroup`** — `options`, `value?`, `defaultValue?`, `onChange?: (value,
  event) => void`, `orientation?` (default `'vertical'`). Rendered as a
  `<fieldset>` via the `group` variant.
- **`CheckboxGroup`** — `options`, `value?: readonly string[]`, `defaultValue?:
  readonly string[]`, `onChange?: (values: string[], event) => void`,
  `orientation?`. `onChange` gets the full set after the change. Uses
  `aria-required` on the fieldset rather than `required` on each box (which would
  demand *every* box be ticked).

### Boolean and file controls

- **`Checkbox`** — `checked?`, `defaultChecked?`, `isIndeterminate?`. Inline
  variant. Read-only disables the input and restores its value via
  `ReadOnlySubmitValue`.
- **`Switch`** — same prop shape as Checkbox (minus `isIndeterminate`); a native
  checkbox styled as a track/knob.
- **`FileInput`** — `hasFileList?` (default true; lists chosen files with sizes).
  Cannot be controlled. Read-only means disabled (a file handle can't be
  recreated, so there's no `ReadOnlySubmitValue`).

### `Button` — the exception

Does **not** extend `FieldBaseProps` and does not use `FormField`, because it has
no label/hint/value-state to hand to the field shell. Exports `Button`,
`ButtonProps`, `ButtonVariant`, `ButtonLogoPosition`.

| Prop | Type | Notes |
| --- | --- | --- |
| `variant` | `ButtonVariant` | `'default' \| 'emphasized' \| 'transparent' \| 'positive' \| 'negative'`; default `'default'` |
| `density` | `FieldDensity` | `'cozy'` (36px) default, `'compact'` (26px) |
| `logo` | `FieldAdornment` | string URL → `<img>`; node → inherits `currentColor` |
| `logoPosition` | `'start' \| 'end'` | default `'start'` |
| `logoAlt` | `string` | only for a logo carrying meaning the label doesn't |
| `isDisabled` | `boolean` | |
| `isLoading` | `boolean` | spinner in the logo's slot + `aria-busy` |
| `isFullWidth` | `boolean` | |
| plus | `ButtonHTMLAttributes` | minus the managed ones |

Two deliberate defaults: `type` is `"button"` (not the HTML default `"submit"`,
so a button inside a form doesn't submit it by accident — pass `type="submit"`
explicitly), and the labelling is a union type that **won't compile** a
logo-only button without an `aria-label`.

## `structure/`

`Form` → `FormSection` → `FormRow` nest in that order and decide every layout
question. Nothing below them carries layout props — it inherits through CSS.

- **`Form`** — the `<form>` element and the one place layout is decided.
  `labelPlacement?` (`'above'` default, `'beside'` for the dense two-column ERP
  look, dropping to `'above'` under 768px), `density?` (`'cozy'`/`'compact'` —
  reassigns `--control-height` for the whole subtree, which also shrinks
  `Button`s inside it), `isNarrow?` (caps field width), plus `FormHTMLAttributes`.
- **`FormSection`** — `title` (required), `description?`, `headingLevel?`
  (`'h2' | 'h3' | 'h4'`, default `'h3'`). A heading over the fields you nest.
- **`FormRow`** — `columns?` (`1 | 2 | 3`, default `2`). CSS grid that collapses
  to one column below 768px.
- **`FormActions`** — the footer bar. `alignment?` (`'start' | 'end' |
  'space-between'`, default `'end'`), `isSticky?`. Never row-reversed (keeps tab
  order matching visual order — WCAG 2.4.3).
- **`MessageStrip`** — form-level feedback. `valueState` (required), `isLive?`
  (sets `role="alert"` for errors, `role="status"` otherwise). The counterpart
  to a field's `valueState`.

## Building a control the library doesn't have

`FormField` + `useFormField` is the pair, and `splitFieldProps` separates your
props from the DOM node's:

```tsx
const [field, nativeProps] = splitFieldProps(props)
const { fieldProps, controlProps } = useFormField(field)

return (
  <FormField {...fieldProps}>
    <MyCustomControl {...controlProps} {...nativeProps} />
  </FormField>
)
```
