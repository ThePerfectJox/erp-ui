# Form

## What it is

The `form` module is everything needed to build a data-entry screen:

- Structure components that lay a form out: `Form`, `FormSection`, `FormRow`,
  `FormActions`, and `MessageStrip` for form-level feedback.
- Eleven field controls: `TextInput`, `NumberInput`, `DateInput`, `TextArea`,
  `Select`, `ComboBox`, `RadioGroup`, `CheckboxGroup`, `Checkbox`, `Switch`,
  `FileInput`.
- `Button`.
- The building blocks the controls are made from (`FormField`,
  `useFormField`...), for writing your own control.

Every field control draws its label, required marker, hint and validation
message the same way, through one shared wrapper (`FormField`). So all fields
on a screen line up and read alike, and you only describe a field with props.

```tsx
import {
  Form, FormSection, FormRow, FormActions, MessageStrip,
  TextInput, NumberInput, DateInput, TextArea,
  Select, ComboBox, RadioGroup, CheckboxGroup, Checkbox, Switch, FileInput,
  Button,
} from './erp-ui-components/form'
import type { FieldOption } from './erp-ui-components/form'
```

## How to use it

### The basic shape

`Form` contains `FormSection`s, which contain `FormRow`s, which contain fields.
`FormActions` closes the form with its buttons.

```tsx
<Form labelPlacement="beside" onSubmit={handleSubmit} noValidate>
  <FormSection title="Header" description="Applies to every item on this order.">
    <FormRow>
      <TextInput label="Supplier" name="supplier" isRequired />
      <DateInput label="Delivery date" name="deliveryDate" />
    </FormRow>
  </FormSection>

  <FormActions>
    <Button variant="transparent">Cancel</Button>
    <Button variant="emphasized" type="submit">Save</Button>
  </FormActions>
</Form>
```

Layout is decided by the structure components only. Fields have no layout
props. They inherit label placement and density from the `Form` through CSS.

Set `noValidate` when you show your own `valueState` messages. Otherwise the
browser shows its own popup for the same problem.

### Props every field accepts

All eleven field controls share these props (`FieldBaseProps`). Only `label`
is required.

| Prop | Type | Description |
| --- | --- | --- |
| `label` | `string` | Required. The visible label, also the accessible name. |
| `name` | `string` | Name submitted with the form. |
| `id` | `string` | Overrides the generated id. Usually leave it off. |
| `hint` | `string` | Help text always shown under the control. Use it instead of a placeholder for rules ("Must match the invoice number"). |
| `valueState` | `'error' \| 'warning' \| 'success' \| 'information'` | Colours the field and its message. |
| `valueStateMessage` | `string` | The message under the field. Shown only when `valueState` is also set. |
| `isRequired` | `boolean` | Adds an asterisk to the label and `required` to the control. |
| `isDisabled` | `boolean` | Fades the field and blocks interaction. Disabled fields are skipped by Tab. |
| `isReadOnly` | `boolean` | The value can be read, copied and is submitted, but not edited. Shown with a dashed underline. Prefer it over disabled for values the user needs to see. |
| `isLabelHidden` | `boolean` | Hides the label visually; screen readers still read it. |
| `labelPlacement` | `'above' \| 'beside'` | Overrides the form's placement for this field. |
| `className` | `string` | Added to the field's wrapper (`.form-field`), not the input. |

Only `valueState="error"` sets `aria-invalid`. The other states are not errors.

Showing validation:

```tsx
<TextInput
  label="Contact email"
  type="email"
  value={email}
  onChange={event => setEmail(event.target.value)}
  valueState={isEmailValid ? undefined : 'error'}
  valueStateMessage="Enter a complete address, for example name@company.com"
/>
```

### Native attributes

`TextInput`, `NumberInput`, `DateInput`, `TextArea`, `Select`, `Checkbox`,
`Switch` and `FileInput` pass any native attribute through to their input:
`value`, `defaultValue`, `onChange`, `onBlur`, `placeholder`, `maxLength`,
`min`, `max`, `step`, `autoComplete`, `autoFocus`, `data-*` and so on. They
work controlled (`value` + `onChange`) or uncontrolled (`defaultValue`), like
the native element.

A few attributes are managed by the field and can't be passed: `id`, `name`,
`required`, `disabled`, `readOnly`, `className`, `aria-invalid`,
`aria-describedby`. Use the `FieldBaseProps` equivalents.

`ComboBox`, `RadioGroup` and `CheckboxGroup` accept only their documented
props.

### Options

`Select`, `ComboBox`, `RadioGroup` and `CheckboxGroup` take a list of options:

```ts
interface FieldOption {
  value: string          // submitted
  label: string          // shown
  description?: string   // second line (RadioGroup and CheckboxGroup only)
  isDisabled?: boolean
}
```

```tsx
const PLANTS: FieldOption[] = [
  { value: '1000', label: '1000 · Hamburg' },
  { value: '2000', label: '2000 · Munich' },
  { value: '3000', label: '3000 · Vienna', isDisabled: true },
]
```

## Structure components

### `Form`

The `<form>` element, and the one place layout is decided.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `labelPlacement` | `'above' \| 'beside'` | `'above'` | `'beside'` puts labels in a left column (`--form-label-width`) for the dense ERP look. It falls back to `'above'` below 768px. |
| `density` | `'cozy' \| 'compact'` | `'cozy'` | `'compact'` shrinks every control and button inside from 36px to 26px. |
| `isNarrow` | `boolean` | | Caps each control at 32rem wide. |
| `className` | `string` | | Added to the `<form>`. |
| …native | `FormHTMLAttributes` | | `onSubmit`, `noValidate`, `action`, etc. |

### `FormSection`

A titled group of fields.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `title` | `string` | | Required. The section heading. |
| `description` | `string` | | A line under the title. |
| `headingLevel` | `'h2' \| 'h3' \| 'h4'` | `'h3'` | Pick the level that fits your page outline. |
| `children` | `ReactNode` | | |

### `FormRow`

Puts fields side by side in a grid. Collapses to one column below 768px.

| Prop | Type | Default |
| --- | --- | --- |
| `columns` | `1 \| 2 \| 3` | `2` |
| `children` | `ReactNode` | |

### `FormActions`

The button bar at the end of a form. Buttons keep their source order (it's
never reversed), so tab order matches what's on screen. Put the main action
last so it lands on the right.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `alignment` | `'start' \| 'end' \| 'space-between'` | `'end'` | |
| `isSticky` | `boolean` | | Sticks the bar to the bottom of the viewport while the form scrolls. |
| `children` | `ReactNode` | | |

### `MessageStrip`

A banner for form-level messages: "3 fields need attention", "Order saved".
It has a coloured bar and a bold prefix ("Error:", "Warning:", "Success:",
"Information:"), so the state doesn't depend on colour.

| Prop | Type | Description |
| --- | --- | --- |
| `valueState` | `'error' \| 'warning' \| 'success' \| 'information'` | Required. |
| `isLive` | `boolean` | Announces the message to screen readers when it appears (`role="alert"` for errors, `role="status"` otherwise). Use it for strips that appear after an action. Leave it off for strips that are on the page from the start. |
| `children` | `ReactNode` | The message. |

```tsx
{saveError && (
  <MessageStrip valueState="error" isLive>
    3 fields need attention before this order can be saved.
  </MessageStrip>
)}
```

Use it together with field `valueState`s, not instead of them: the strip says
something is wrong, the field says what.

## Field controls

Each control below accepts all [props every field accepts](#props-every-field-accepts)
plus the extra props listed.

### `TextInput`

Single-line text.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | `'text' \| 'email' \| 'password' \| 'tel' \| 'url' \| 'search'` | `'text'` | Picks the mobile keyboard and autofill. For numbers, use `NumberInput`. |
| `prefix` | `string \| ReactNode` | | Fixed text inside the field before the value. |
| `suffix` | `string \| ReactNode` | | Fixed text inside the field after the value. |

```tsx
<TextInput label="Website" type="url" prefix="https://" name="website" />
```

### `NumberInput`

A numeric input with right-aligned, fixed-width digits so amounts line up.
Spinner buttons are hidden. `event.target.value` is a string, like any input.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `unit` | `string \| ReactNode` | | Shown inside the field after the value ("EA", "kg", "%"). |
| `prefix` | `string \| ReactNode` | | Shown before the value ("€"). |
| `isTextAligned` | `boolean` | | Left-aligns the value like text (for ids or codes). |

Use the native `min`, `max` and `step`. `inputMode` defaults to `"decimal"`.

```tsx
<NumberInput label="Net price" prefix="€" unit="/ EA" step={0.01} min={0} name="price" />
```

### `DateInput`

The browser's native date and time pickers. Values are ISO 8601 strings
(`"2026-10-06"`, `"14:30"`).

| Prop | Type | Default |
| --- | --- | --- |
| `type` | `'date' \| 'time' \| 'datetime-local' \| 'month' \| 'week'` | `'date'` |

```tsx
<DateInput label="Delivery date" value={date} onChange={event => setDate(event.target.value)} min="2026-10-06" />
```

### `TextArea`

Multi-line text. Resizable vertically only.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `rows` | `number` | `3` | Initial height in lines. |
| `hasCounter` | `boolean` | | Shows "used / limit" under the field. Needs `maxLength`. |

```tsx
<TextArea label="Note to supplier" maxLength={500} hasCounter rows={4} />
```

### `Select`

A native `<select>`, best for short lists (up to about 10 options). For longer
lists, use `ComboBox`.

| Prop | Type | Description |
| --- | --- | --- |
| `options` | `readonly FieldOption[]` | Required. |
| `placeholder` | `string` | Adds a first, disabled, empty option ("Select a plant"). |

`multiple` isn't supported. When read-only, the select shows only the chosen
option and still submits it.

```tsx
<Select label="Plant" options={PLANTS} placeholder="Select a plant" value={plant} onChange={event => setPlant(event.target.value)} />
```

### `ComboBox`

A searchable dropdown for long lists (materials, cost centres, suppliers). The
user types to filter, and the value must always be one of the options (free
text is never kept). It submits the option's `value` through a hidden input.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `options` | `readonly FieldOption[]` | | Required. |
| `value` | `string` | | Controlled value (an option `value`). |
| `defaultValue` | `string` | | Uncontrolled starting value. |
| `onChange` | `(value: string) => void` | | Called with the new option value (not an event). |
| `placeholder` | `string` | | |
| `noResultsText` | `string` | `'No matches found'` | |
| `filter` | `(option: FieldOption, query: string) => boolean` | `matchLabelOrValue` | Custom matching. The default is a case-insensitive substring match on label or value. |
| `isClearable` | `boolean` | | Shows a × button that clears the value. |

Keyboard: `↓`/`↑` open the list and move, `Home`/`End` jump to the first/last
option, `Enter` picks the highlighted option (or submits the form when nothing
is highlighted), `Tab` picks it and moves on, `Esc` closes and reverts to the
last committed value.

```tsx
<ComboBox
  label="Material"
  name="material"
  options={MATERIALS}
  value={material}
  onChange={setMaterial}
  placeholder="Search by number or description"
  isClearable
/>
```

Custom filter, matching only from the start of the label:

```tsx
<ComboBox
  label="Supplier"
  options={SUPPLIERS}
  filter={(option, query) => option.label.toLowerCase().startsWith(query.trim().toLowerCase())}
/>
```

### `RadioGroup`

Pick one of a few options (two to five). Rendered as a `<fieldset>`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `options` | `readonly FieldOption[]` | | Required. `description` is shown under each label. |
| `value` | `string` | | Controlled. |
| `defaultValue` | `string` | | Uncontrolled. |
| `onChange` | `(value: string, event) => void` | | |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Horizontal only for two or three short options. |

```tsx
<RadioGroup
  label="Shipping"
  name="shipping"
  options={[
    { value: 'standard', label: 'Standard', description: '5–7 working days' },
    { value: 'express', label: 'Express', description: 'Next working day' },
  ]}
  value={shipping}
  onChange={setShipping}
/>
```

### `CheckboxGroup`

Pick any number of options. Rendered as a `<fieldset>`.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `options` | `readonly FieldOption[]` | | Required. |
| `value` | `readonly string[]` | | Controlled. Pass this when you use `onChange`. |
| `defaultValue` | `readonly string[]` | | Uncontrolled. |
| `onChange` | `(values: string[], event) => void` | | Receives the whole new set, in option order. |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | |

`isRequired` marks the group as required (`aria-required`); it doesn't force
every box to be ticked.

```tsx
<CheckboxGroup label="Output" options={OUTPUTS} value={outputs} onChange={setOutputs} orientation="horizontal" />
```

### `Checkbox`

A single yes/no choice, with the label next to the box (clicking the label
toggles it).

| Prop | Type | Description |
| --- | --- | --- |
| `checked` | `boolean` | Controlled. |
| `defaultChecked` | `boolean` | Uncontrolled. |
| `isIndeterminate` | `boolean` | Shows the "partly selected" dash. |

When read-only, the checkbox is disabled but its value is still submitted.

```tsx
<Checkbox label="I have checked the delivery address" checked={isChecked} onChange={event => setIsChecked(event.target.checked)} />
```

### `Switch`

An on/off toggle for settings that take effect straight away. Same props as
`Checkbox`, without `isIndeterminate`.

```tsx
<Switch label="Send order confirmation by email" defaultChecked name="sendEmail" />
```

### `FileInput`

A native file picker with a list of chosen files and their sizes. It can't be
controlled (browsers don't allow setting a file input's value). Read-only means
disabled.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `hasFileList` | `boolean` | `true` | Shows the chosen file names and sizes. |

Use native `accept` and `multiple`:

```tsx
<FileInput label="Attachments" name="files" multiple accept=".pdf,.png,.jpg" hint="PDF or image, up to 10 MB each." />
```

## `Button`

`Button` is not a field: it has no label prop, hint or value state.

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `variant` | `'default' \| 'emphasized' \| 'transparent' \| 'positive' \| 'negative'` | `'default'` | See below. |
| `density` | `'cozy' \| 'compact'` | `'cozy'` | 36px or 26px tall. Inside `<Form density="compact">` buttons are compact automatically. |
| `logo` | `string \| ReactNode` | | An icon. A string is an image URL (an imported `.svg`); a node (inline `<svg>`) takes the button's text colour. |
| `logoPosition` | `'start' \| 'end'` | `'start'` | |
| `logoAlt` | `string` | | Only for an icon that says something the label doesn't. |
| `isDisabled` | `boolean` | | |
| `isLoading` | `boolean` | | Replaces the icon with a spinner, disables the button and sets `aria-busy`. |
| `isFullWidth` | `boolean` | | |
| `className` | `string` | | Added to the `<button>`. |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | Not `'submit'` like plain HTML, so a button in a form doesn't submit by accident. Pass `type="submit"` for the save button. |
| …native | `ButtonHTMLAttributes` | | `onClick`, `form`, `title`, etc. |

Variants, from quietest to loudest:

| Variant | Look | Use for |
| --- | --- | --- |
| `transparent` | no border until hovered | toolbars, table rows, Cancel |
| `default` | white, grey border, blue text | most actions |
| `emphasized` | filled blue, bold | the one main action on a screen (Save) |
| `positive` | filled green | actions with a positive consequence (Post, Release) |
| `negative` | filled red | destructive actions (Delete) |

Use one filled button per screen or dialog.

```tsx
import downloadIcon from './erp-ui-components/assets/download.svg'

<Button logo={downloadIcon}>Export</Button>                       {/* image URL */}
<Button variant="negative" logo={<DeleteIcon />}>Delete</Button>   {/* inline SVG, inherits white */}
<Button variant="emphasized" type="submit" isLoading={isSaving}>Save</Button>
<Button variant="transparent" logo={<FilterIcon />} aria-label="Filter items" />  {/* icon only */}
```

An icon-only button (no children) must have an `aria-label`. TypeScript won't
compile it without one.

## How to customize

### With props

- Density: `<Form density="compact">` for the whole form, or
  `<Button density="compact">` for one button.
- Label layout: `<Form labelPlacement="beside">` for the form,
  `labelPlacement` on a field to override it.
- Width: `<Form isNarrow>` caps controls at 32rem. `<FormRow columns={3}>`
  for more fields per row.
- Text: `hint`, `placeholder`, `noResultsText`, `valueStateMessage`.

### With variables

Set these on any wrapper (or a `Form`'s `className`):

| Variable | Default | Effect |
| --- | --- | --- |
| `--control-height` | `2.25rem` | height of inputs, selects, comboboxes and buttons |
| `--control-height-compact` | `1.625rem` | height in compact density |
| `--control-padding-x` | `0.625rem` | horizontal padding inside fields |
| `--form-label-width` | `10rem` | width of the label column in `beside` forms |

```css
.long-labels { --form-label-width: 14rem; }
```

```tsx
<Form labelPlacement="beside" className="long-labels">…</Form>
```

Each field also has four variables, set on its `.form-field` wrapper and
changed by its state:

| Variable | Default | Meaning |
| --- | --- | --- |
| `--field-fill` | `var(--color-surface-sunken)` | background of the input |
| `--field-line` | `var(--color-field-border)` | colour of the underline |
| `--field-line-width` | `1px` (`2px` with a value state) | thickness of the underline |
| `--field-message-color` | `var(--color-text-muted)` | colour of the hint/message |

Override them for one field through its `className`:

```css
.form-field.field-key { --field-fill: var(--color-primary-soft); }
```

To change all fields in an area, override the tokens they come from
(`--color-surface-sunken`, `--color-field-border`, `--color-danger-soft`...) on
a wrapper. See [customization.md](./customization.md).

### With CSS classes

Each field renders this structure. `className` lands on the outer element.

```text
div.form-field.form-field-stacked          (fieldset for groups, -inline for Checkbox/Switch)
  label.form-field-label
    span.form-field-required               the asterisk
  div.form-field-control
    input.form-control                     the control (or select, textarea, ...)
    p.form-field-hint
    p.form-field-message
```

| Class | Element |
| --- | --- |
| `.form` | the `<form>`; also `.form-labels-above` / `.form-labels-beside`, `.form-density-cozy` / `.form-density-compact`, `.form-narrow` |
| `.form-section`, `.form-section-header`, `.form-section-title`, `.form-section-description`, `.form-section-body` | `FormSection` |
| `.form-row`, `.form-row-2`, `.form-row-3` | `FormRow` |
| `.form-actions`, `.form-actions-start` / `-end` / `-space-between`, `.form-actions-sticky` | `FormActions` |
| `.form-message-strip`, `.form-message-strip-{state}`, `.form-message-strip-prefix`, `.form-message-strip-text` | `MessageStrip` |
| `.form-field` | every field's wrapper; plus `.form-field-stacked` / `-inline` / `-group` |
| `.form-field-error`, `-warning`, `-success`, `-information`, `-disabled`, `-readonly` | field states |
| `.form-field-label-above`, `.form-field-label-beside` | per-field placement override |
| `.form-field-label`, `.form-field-required`, `.form-field-control`, `.form-field-hint`, `.form-field-message` | field chrome |
| `.form-control` | every text-like input, select and textarea |
| `.form-control-numeric`, `.form-control-date`, `.form-control-textarea`, `.form-control-file` | per-control modifiers |
| `.form-control-shell`, `.form-control-affix`, `.form-control-prefix`, `.form-control-suffix` | prefix/suffix wrapper |
| `.form-control-counter` | `TextArea` counter |
| `.form-select-shell`, `.form-select`, `.form-select-chevron` | `Select` |
| `.form-combobox`, `-shell`, `-input`, `-chevron`, `-clear`, `-popup`, `-list`, `-option`, `-option-active`, `-option-selected`, `-option-disabled`, `-option-label`, `-option-description`, `-match`, `-empty` | `ComboBox` |
| `.form-choice-list`, `-vertical`, `-horizontal`, `.form-choice`, `.form-choice-label`, `.form-choice-description`, `.form-radio`, `.form-checkbox` | `RadioGroup`, `CheckboxGroup`, `Checkbox` |
| `.form-switch`, `.form-switch-input`, `.form-switch-track`, `.form-switch-knob` | `Switch` |
| `.form-file-list`, `.form-file-list-item`, `.form-file-name`, `.form-file-size` | `FileInput` list |
| `.form-button`, `.form-button-{variant}`, `-compact`, `-full-width`, `-icon-only`, `-loading`, `.form-button-logo`, `.form-button-label`, `.form-button-spinner` | `Button` |

Breakpoints: rows collapse to one column at `max-width: 767px`; the `beside`
label column applies from `min-width: 768px`.

Example: a custom button variant built on `default`.

```css
.form-button.btn-secondary {
  color: var(--color-on-secondary);
  background-color: var(--color-secondary);
  border-color: var(--color-secondary);
}

.form-button.btn-secondary:hover:not(:disabled) {
  background-color: var(--color-secondary-hover);
}
```

```tsx
<Button className="btn-secondary">Print</Button>
```

## Build your own field

When you need a control the library doesn't have (a currency + amount pair, a
value-help lookup), build it with the same three pieces every built-in control
uses. It then gets the same label, hint, message, required marker and ARIA
wiring.

```tsx
import { FormField, splitFieldProps, useFormField } from './erp-ui-components/form'
import type { FieldBaseProps } from './erp-ui-components/form'

interface ColorInputProps extends FieldBaseProps {
  value: string
  onChange: (value: string) => void
}

function ColorInput(props: ColorInputProps) {
  // 1. Separate the shared field props from your own props
  const [field, { value, onChange }] = splitFieldProps(props)

  // 2. Get ids, ARIA attributes and the props for the wrapper
  const { fieldProps, controlProps } = useFormField(field)

  // 3. Wrap the control in FormField
  return (
    <FormField {...fieldProps}>
      <input
        {...controlProps}
        type="color"
        className="form-control"
        value={value}
        onChange={event => onChange(event.target.value)}
      />
    </FormField>
  )
}
```

Spread `controlProps` last so the managed id and ARIA attributes win.

| Export | What it does |
| --- | --- |
| `splitFieldProps(props)` | Returns `[fieldBaseProps, everythingElse]`. |
| `useFormField(fieldProps)` | Returns `{ fieldProps, controlProps, groupProps, controlId, isInvalid }`. `fieldProps` go on `FormField`; `controlProps` (`id`, `name`, `required`, `disabled`, `readOnly`, `aria-invalid`, `aria-describedby`) go on the input; `groupProps` go on a `fieldset` instead. |
| `FormField` | The wrapper. Props: the `fieldProps` above, plus `variant` (`'stacked'` default, `'inline'` for a label wrapping the control, `'group'` for a fieldset), `groupProps`, `addon` (content under the control, above the hint), `children`. |
| `FormControlShell` | Puts `prefix`/`suffix` text inside the field box around its child. |
| `extractReadOnly(controlProps)` | For controls where `readOnly` isn't a valid HTML attribute (select, checkbox): removes it and adds `aria-readonly`. Returns `[props, isReadOnly]`. |
| `formatFileSize(bytes)` | `"9.4 MB"`, `"94 MB"`. 1024-based. |
| `matchLabelOrValue`, `findSelectableIndex`, `findMatchRange` | The `ComboBox` matching helpers, to reuse in a custom filter. |

Types: `FieldBaseProps`, `FieldOption`, `FieldValueState`,
`FieldLabelPlacement`, `FieldDensity`, `FieldAdornment`, `ChoiceOrientation`,
`FormFieldChromeProps`, `FormControlProps`, `FormGroupProps`,
`PassthroughInputProps`, `PassthroughTextAreaProps`, `PassthroughSelectProps`,
`ButtonProps`, `ButtonVariant`, `ButtonLogoPosition`, `TextInputType`,
`DateInputType`, `FormActionsAlignment`, `FormFieldVariant`,
`UseFormFieldResult`, `NonNativeReadOnlyProps`, `ComboBoxFilter`.
