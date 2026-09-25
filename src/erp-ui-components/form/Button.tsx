import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { FieldAdornment, FieldDensity } from './FieldTypes'

/**
 * How loud the button is. A screen should read as one emphasized button and
 * however many default ones it needs — that is what makes the primary action
 * findable without anyone having to hunt for it.
 *
 * - `"default"`     white, grey border, blue label. The workhorse.
 * - `"emphasized"`  filled brand blue. The one action the screen is for.
 *                   One per screen; two of them is none.
 * - `"transparent"` no border until hovered. Toolbars, table row actions,
 *                   anywhere a row of bordered buttons would read as a fence.
 * - `"positive"`    filled green. Approve, release, post.
 * - `"negative"`    filled red. Deletes and anything else you cannot undo.
 */
export type ButtonVariant = 'default' | 'emphasized' | 'transparent' | 'positive' | 'negative'

/** Which side of the label the logo sits on. */
export type ButtonLogoPosition = 'start' | 'end'

interface ButtonBaseProps
	extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'disabled' | 'children' | 'aria-label'> {
	variant?: ButtonVariant

	/** Cozy (36px) by default; compact (26px) for toolbars and table rows. */
	density?: FieldDensity

	/**
	 * Optional mark shown next to the label — a product logo, an action icon,
	 * a vendor mark.
	 *
	 * Pass the URL you get from importing an `.svg`, exactly as the sidebar
	 * does:
	 *
	 * ```tsx
	 * import saveIcon from '../assets/save.svg'
	 * <Button logo={saveIcon}>Save</Button>
	 * ```
	 *
	 * Or pass a node when the mark has to follow the button's text colour,
	 * which an `<img>` cannot do:
	 *
	 * ```tsx
	 * <Button variant="emphasized" logo={<CheckIcon />}>Approve</Button>
	 * ```
	 *
	 * Either way it is decorative: the button's name comes from its label (or
	 * from `aria-label` when there is no label), so the logo is hidden from
	 * assistive tech and never announced twice.
	 */
	logo?: FieldAdornment

	/** Defaults to `"start"`. */
	logoPosition?: ButtonLogoPosition

	/**
	 * Only for a logo that carries meaning the label does not — a country flag
	 * on an otherwise generic "Continue", say. Leave it unset and the logo is
	 * treated as decoration, which is almost always what you want.
	 */
	logoAlt?: string

	isDisabled?: boolean

	/**
	 * Shows a spinner in place of the logo and blocks input. Kept separate
	 * from `isDisabled` so the button still announces itself as busy rather
	 * than as unavailable — the user is waiting, not barred.
	 */
	isLoading?: boolean

	/** Stretches to the width of its container. For narrow screens and dialogs. */
	isFullWidth?: boolean

	className?: string
}

/**
 * A button needs an accessible name, and it can come from either the label or
 * `aria-label`. Expressing that as a union means a logo-only button will not
 * compile without `aria-label`, so the commonest accessibility bug in any
 * toolbar is caught at build time instead of in an audit.
 */
type ButtonLabelling =
	| { children: ReactNode; 'aria-label'?: string }
	| { children?: undefined; 'aria-label': string }

export type ButtonProps = ButtonBaseProps & ButtonLabelling

/**
 * Renders the logo.
 *
 * A `string` is a URL — what an `.svg` import resolves to — so it becomes an
 * `<img>` with an empty `alt`, which is how you tell a screen reader to ignore
 * an image. Anything else is a node and goes in a wrapper marked
 * `aria-hidden`, which covers an inline `<svg>` that has its own `<title>`.
 */
function renderLogo(logo: FieldAdornment, logoAlt: string | undefined) {
	if (typeof logo === 'string') {
		return <img className="form-button-logo" src={logo} alt={logoAlt ?? ''} />
	}

	return (
		<span className="form-button-logo" aria-hidden={logoAlt ? undefined : true}>
			{logo}
		</span>
	)
}

/**
 * The house button.
 *
 * ```tsx
 * <Button variant="emphasized" onClick={save}>Save</Button>
 * <Button logo={exportIcon}>Export</Button>
 * <Button variant="transparent" logo={filterIcon} aria-label="Filter" />
 * <Button variant="negative" logo={deleteIcon} logoPosition="end">Delete</Button>
 * ```
 *
 * Two defaults worth knowing about, both deliberate:
 *
 * - `type` is `"button"`, not the HTML default of `"submit"`. A button inside
 *   a form that submits it by accident is a genuinely nasty bug on an ERP
 *   screen, so submitting is opt-in: pass `type="submit"`.
 * - `isDisabled`, not `disabled`, to match the `is*` props every control in
 *   this folder uses.
 */
function Button({
	variant = 'default',
	density = 'cozy',
	logo,
	logoPosition = 'start',
	logoAlt,
	isDisabled,
	isLoading,
	isFullWidth,
	className,
	children,
	type = 'button',
	...nativeProps
}: ButtonProps) {
	const classNames = ['form-button', `form-button-${variant}`]

	if (density === 'compact') {
		classNames.push('form-button-compact')
	}

	if (isFullWidth) {
		classNames.push('form-button-full-width')
	}

	/* Drives the square aspect and the equal padding that keeps a lone icon
	 * centred. Derived rather than asked for, so it cannot disagree with
	 * what was actually passed as children. */
	if (children === undefined) {
		classNames.push('form-button-icon-only')
	}

	if (isLoading) {
		classNames.push('form-button-loading')
	}

	if (className) {
		classNames.push(className)
	}

	/* The spinner takes the logo's slot rather than being added alongside it,
	 * so the button does not grow by an icon's width the moment it is pressed
	 * and shift the toolbar around it. */
	const mark = isLoading ? <span className="form-button-spinner" aria-hidden="true" /> : logo ? renderLogo(logo, logoAlt) : null

	return (
		<button
			{...nativeProps}
			type={type}
			className={classNames.join(' ')}
			/* A loading button is not available either, but it says so with
			 * aria-busy below instead of only being inert. */
			disabled={isDisabled || isLoading}
			aria-busy={isLoading ? true : undefined}
		>
			{logoPosition === 'start' && mark}
			{children !== undefined && <span className="form-button-label">{children}</span>}
			{logoPosition === 'end' && mark}
		</button>
	)
}

export default Button
