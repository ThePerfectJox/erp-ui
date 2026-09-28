# `overlay/` — `Modal`

A modal dialog holding whatever you put in it, built on the native `<dialog>`
element.

```tsx
import { Modal } from './erp-ui-components/overlay'
import type { ModalSize } from './erp-ui-components/overlay'

const [isOpen, setIsOpen] = useState(false)

<Button onClick={() => setIsOpen(true)}>Delete</Button>

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Delete purchase order 4500001827?"
  description="The order and all six of its items are removed. This cannot be undone."
  size="small"
  footer={
    <>
      <Button variant="transparent" onClick={() => setIsOpen(false)}>Cancel</Button>
      <Button variant="negative" onClick={remove}>Delete</Button>
    </>
  }
>
  <p>Any goods receipts already posted against it are left in place.</p>
</Modal>
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `isOpen` | `boolean` | — | controlled — the dialog never closes itself, it asks through `onClose` |
| `onClose` | `() => void` | — | called on ×, `Esc`, or backdrop click. Set `isOpen` false here — or don't, and it stays put |
| `title` | `string` | — | **required**; the heading and the dialog's accessible name (rendered as `<h2>`) |
| `description` | `string` | | a line under the heading; wired as the accessible description |
| `children` | `ReactNode` | — | the body; **only mounted while `isOpen`** |
| `footer` | `ReactNode` | | the action bar, confirming button last (rightmost); omit for no bar |
| `size` | `ModalSize` | `'medium'` | see below |
| `isDismissDisabled` | `boolean` | | blocks `Esc` and backdrop click, leaving only the buttons |
| `isCloseButtonHidden` | `boolean` | | hides the × |
| `isBodyFlush` | `boolean` | | drops the body padding, for content that draws its own frame (a `DataGrid`, a chart) |
| `className` | `string` | | |

`ModalSize = 'small' | 'medium' | 'large' | 'full'` — **widths**, not heights
(small 28rem, medium 40rem, large 64rem, full = the viewport less a margin). The
dialog is always as tall as its content up to a cap, and its body scrolls past
that. `Modal` and `ModalSize` are the only exports (`ModalProps` is internal).

## Why controlled

The dialog never closes itself — closing an ERP dialog is frequently not
unconditional ("Discard the three changes you've made?" is a decision the screen
owns). So it always asks through `onClose`, and the screen decides.

`children` being mounted only while open means a form inside starts blank every
time, a grid inside doesn't render 500 rows on a screen where the dialog is never
used, and an `autoFocus` inside works on every open rather than only the first.

## Built on the real `<dialog>`

`showModal()` does the hard parts, correctly, for free:

- **Focus is trapped** inside the dialog, and restored on close.
- **Everything behind it is inert** — genuinely unreachable by pointer, keyboard
  and screen reader, not just `aria-hidden`.
- **It renders in the top layer**, above every stacking context — no portal, no
  `z-index` arms race with a sticky header.
- **`Esc` is wired up**, arriving as the `cancel` event.

The one thing the browser does *not* do is stop the page behind from scrolling;
that's a CSS lock in `Modal.css`.

### Focus on open

The browser focuses the first thing in the dialog — usually the ×, which is safe
but rarely useful. Put `autoFocus` on the control the user should start with and
it wins:

```tsx
<TextInput label="Reason" autoFocus />
```

Do **not** autofocus a destructive button — a dialog that deletes on one press of
`Enter` is a data-loss bug with a confirmation step bolted on.

### Backdrop dismissal, done carefully

Clicking the backdrop closes the dialog, but a `click` on the backdrop can't be
trusted alone: press inside the dialog, drag out (selecting text, overshooting a
slider) and release over the backdrop, and the browser reports a click on the
dialog. So dismissal requires *both* ends of the gesture — the `pointerdown` and
the `click` — to land on the dialog element itself.
