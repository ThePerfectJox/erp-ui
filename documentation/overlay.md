# Overlay (Modal)

## What it is

`Modal` is a dialog that opens over the screen: confirmations, short forms,
detail views. It's built on the browser's native `<dialog>` element, so it gets
these for free:

- Focus moves into the dialog, stays there while it's open, and returns to
  where it was when it closes.
- Everything behind it can't be clicked, tabbed to or read by a screen reader.
- It always appears above everything else (no `z-index` needed).
- `Esc` closes it.

The page behind is also prevented from scrolling while it's open.

The modal provides the frame (title, close button, scrolling body, footer).
What goes inside is up to you: text, a form, a `DataGrid`, a chart.

```tsx
import { Modal } from './erp-ui-components/overlay'
import type { ModalSize } from './erp-ui-components/overlay'
```

## How to use it

### A confirmation dialog

`Modal` is controlled. You keep `isOpen` in state and set it to `false` in
`onClose`.

```tsx
const [isOpen, setIsOpen] = useState(false)

<Button variant="negative" onClick={() => setIsOpen(true)}>Delete</Button>

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Delete purchase order 4500001827?"
  description="The order and all six items are removed. This cannot be undone."
  size="small"
  footer={
    <>
      <Button variant="transparent" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button variant="negative" onClick={handleDelete}>Delete</Button>
    </>
  }
>
  <p>Goods receipts already posted against it are left in place.</p>
</Modal>
```

`onClose` is called when the user presses ×, presses `Esc`, or clicks the dark
backdrop. The dialog only closes when you set `isOpen` to `false`. So you can
ask first:

```tsx
onClose={() => {
  if (!hasChanges || window.confirm('Discard your changes?')) {
    setIsOpen(false)
  }
}}
```

Put buttons in `footer` in reading order, with the confirming action last (it
lands on the right). On screens 480px wide or less, footer buttons stack and
go full width, with the last button on top.

Direct children of the body get `--space-4` of space between them, so you can
put a message strip, a grid and a paragraph in a row without wrapper divs.

### A form in a dialog

Content is only mounted while the dialog is open, so a form inside starts
fresh every time. Use `autoFocus` on the field the user should start with.
Otherwise the first focusable element (the ×) gets focus.

```tsx
<Modal
  isOpen={isOpen}
  onClose={close}
  title="Reject requisition"
  footer={
    <>
      <Button variant="transparent" onClick={close}>Cancel</Button>
      <Button variant="emphasized" type="submit" form="reject-form">Reject</Button>
    </>
  }
>
  <Form id="reject-form" onSubmit={handleReject}>
    <TextArea label="Reason" name="reason" isRequired autoFocus />
  </Form>
</Modal>
```

The footer is outside the form element, so the submit button uses the native
`form` attribute to point at it.

Don't put `autoFocus` on a destructive button. One press of `Enter` would
delete.

Render the `Modal` outside any other `<form>` on the page, so `Enter` in the
dialog can't submit the page's form.

### A grid or chart in a dialog

```tsx
<Modal isOpen={isOpen} onClose={close} title="Order items" size="large" isBodyFlush>
  <DataGrid caption="Items" isCaptionHidden columns={COLUMNS} rows={items} isReadOnly />
</Modal>
```

`isBodyFlush` removes the body padding for content that has its own frame.

### A dialog that must be answered

`isDismissDisabled` blocks `Esc` and backdrop clicks. The × still calls
`onClose` unless you also hide it with `isCloseButtonHidden`. Use this rarely.

```tsx
<Modal
  isOpen={isOpen}
  onClose={close}
  title="Accept the updated terms"
  isDismissDisabled
  isCloseButtonHidden
  footer={<Button variant="emphasized" onClick={accept}>Accept</Button>}
>
  …
</Modal>
```

## API reference

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `isOpen` | `boolean` | | Required. Whether the dialog is shown. |
| `onClose` | `() => void` | | Required. Called on ×, `Esc` or backdrop click. Set `isOpen` to `false` here. |
| `title` | `string` | | Required. The heading (`<h2>`) and the dialog's accessible name. |
| `description` | `string` | | A line under the title, read out after it. |
| `children` | `ReactNode` | | Required. The body. Only mounted while open. Scrolls when it's too tall. |
| `footer` | `ReactNode` | | Action buttons. Leave it off for no footer. |
| `size` | `'small' \| 'medium' \| 'large' \| 'full'` | `'medium'` | Width: 28rem, 40rem, 64rem, or the whole viewport minus a margin. |
| `isDismissDisabled` | `boolean` | | Blocks `Esc` and backdrop click. |
| `isCloseButtonHidden` | `boolean` | | Hides the ×. |
| `isBodyFlush` | `boolean` | | Removes the body padding. |
| `className` | `string` | | Added to the `<dialog>`. |

Height grows with the content, up to the viewport height minus a margin; then
the body scrolls while the title and footer stay put. `size="full"` always
fills the viewport.

## How to customize

### With props

`size`, `isBodyFlush`, `footer`, `isCloseButtonHidden`.

### With tokens

| Token | Used for |
| --- | --- |
| `--color-surface` | dialog background |
| `--radius-lg` | corner radius |
| `--shadow-lg` | shadow |
| `--color-border` | lines under the header and above the footer |
| `--text-xl` | title size |
| `--space-4`, `--space-5` | padding |
| `--transition` | open/close animation duration |

### With CSS classes

```text
dialog.modal.modal-medium              ← className
  div.modal-frame
    header.modal-header
      div.modal-heading
        h2.modal-title
        p.modal-description
      button.modal-close
    div.modal-body(.modal-body-flush)
    footer.modal-footer
```

| Class / selector | Element |
| --- | --- |
| `.modal` | the `<dialog>` |
| `.modal-small`, `.modal-medium`, `.modal-large`, `.modal-full` | size |
| `.modal[open]` | open state |
| `.modal::backdrop` | the dark overlay |
| `.modal-frame` | three-row grid: header, body, footer |
| `.modal-header`, `.modal-heading`, `.modal-title`, `.modal-description` | header |
| `.modal-close` | × button |
| `.modal-body`, `.modal-body-flush` | content |
| `.modal-footer` | footer |

Examples, using a `className` (the double class beats the size classes):

```css
/* A custom width */
.modal.wizard-dialog { width: 52rem; }

/* A lighter backdrop */
.modal.wizard-dialog::backdrop { background-color: rgba(34, 53, 72, 0.3); }

/* A tinted header */
.modal.wizard-dialog .modal-header { background-color: var(--color-surface-sunken); }

/* Left-aligned footer buttons */
.modal.wizard-dialog .modal-footer { justify-content: flex-start; }
```

```tsx
<Modal className="wizard-dialog" … />
```

Global side effects of `Modal.css` to be aware of:

- `body:has(dialog.modal[open]) { overflow: hidden }` locks page scroll while
  any modal is open.
- `html { scrollbar-gutter: stable }` always reserves space for the scrollbar,
  so the page doesn't shift when the lock turns on. It applies to every page,
  even without an open modal.

## Notes

- If something closes the dialog outside React (a `<form method="dialog">`
  inside it, or calling `dialog.close()`), `onClose` is called so your state
  stays in sync.
- A backdrop click only closes the dialog when both the press and the release
  are on the backdrop. Dragging from inside the dialog to outside (for example
  while selecting text) doesn't close it.
- The open/close animation is turned off when the user prefers reduced motion.
