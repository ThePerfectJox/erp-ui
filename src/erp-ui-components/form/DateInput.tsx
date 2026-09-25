import FormField from './FormField'
import { splitFieldProps, useFormField } from './useFormField'
import type { FieldBaseProps, PassthroughInputProps } from './FieldTypes'

/**
 * Which slice of the calendar or clock is being entered. The browser supplies
 * the picker and the locale formatting for each, so a German user sees
 * `31.12.2026` and an American user sees `12/31/2026` with no work here.
 *
 * - `"date"`           a day.                       Value: `"2026-12-31"`
 * - `"time"`           a time of day.               Value: `"14:30"`
 * - `"datetime-local"` both, with no time zone.     Value: `"2026-12-31T14:30"`
 * - `"month"`          a posting period.            Value: `"2026-12"`
 * - `"week"`           a planning week.             Value: `"2026-W53"`
 *
 * Every value is an ISO 8601 string regardless of how it is displayed, which is
 * what makes them safe to compare, sort and send to a backend as-is.
 */
export type DateInputType = 'date' | 'time' | 'datetime-local' | 'month' | 'week'

interface DateInputProps extends FieldBaseProps, PassthroughInputProps {
	/** Defaults to `"date"`. */
	type?: DateInputType
}

/**
 * Date and time entry.
 *
 * ```tsx
 * <DateInput
 *     label="Delivery date"
 *     value={deliveryDate}
 *     onChange={event => setDeliveryDate(event.target.value)}
 *     min={today}
 *     isRequired
 * />
 *
 * <DateInput label="Posting period" type="month" value={period} />
 * ```
 *
 * `min` and `max` take the same ISO strings the value uses, and the browser
 * enforces them in the picker as well as on submit — so an out-of-range date
 * is hard to pick in the first place, not just rejected afterwards. Use them
 * for real constraints (no backdating past the closed period) and say why in
 * `hint`, because a greyed-out day in a calendar explains nothing on its own.
 */
function DateInput({ type = 'date', ...props }: DateInputProps) {
	const [field, nativeProps] = splitFieldProps(props)
	const { fieldProps, controlProps } = useFormField(field)

	return (
		<FormField {...fieldProps}>
			<input {...nativeProps} {...controlProps} type={type} className="form-control form-control-date" />
		</FormField>
	)
}

export default DateInput
