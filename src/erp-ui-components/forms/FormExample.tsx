import { useState } from "react";
import {
	TextInput,
	TextArea,
	RadioGroup,
	CheckboxGroup,
	Combobox,
	DateInput,
	NumberInput,
	SubmitButton,
	FormSection,
	FormRow,
} from "./index";
import type { FormValues } from "./formsUtils";

const departments = ["Sales", "Engineering", "Finance", "Operations", "Human Resources"];

/**
 * End-to-end example — mirrors ModalExample.tsx/DataTableExample.tsx. Not
 * exported from the barrel; render it from a route/screen to try the fields
 * by hand.
 *
 * Every field here is an ordinary native form control — nothing is wired to
 * React state per field. SubmitButton reads the owning <form> through the
 * native `button.form` property and hands back a plain object built from
 * FormData, which is what gets shown below the form.
 *
 * FormSection groups fields under a heading; FormRow (Name + Department,
 * Start date + Salary) puts its fields side by side once the viewport is
 * wide enough, and stacks them below that — resize the window to see it.
 */
export default function FormExample() {
	const [submitted, setSubmitted] = useState<FormValues | null>(null);

	return (
		<form style={{ maxWidth: "640px" }}>
			<FormSection title="Personal details" description="Basic information about the employee.">
				<FormRow>
					<div>
						<label htmlFor="employee-name">Name</label>
						<TextInput id="employee-name" name="name" placeholder="Jane Doe" required />
					</div>
					<div>
						<label htmlFor="employee-department">Department</label>
						<Combobox id="employee-department" name="department" options={departments} placeholder="Start typing..." />
					</div>
				</FormRow>
				<div>
					<label htmlFor="employee-notes">Notes</label>
					<TextArea id="employee-notes" name="notes" placeholder="Optional notes" />
				</div>
			</FormSection>

			<FormSection title="Employment" description="Type and benefits.">
				<RadioGroup
					name="employmentType"
					legend="Employment type"
					defaultValue="full-time"
					options={[
						{ label: "Full-time", value: "full-time" },
						{ label: "Part-time", value: "part-time" },
						{ label: "Contractor", value: "contractor" },
					]}
				/>
				<CheckboxGroup
					name="benefits"
					legend="Benefits"
					options={[
						{ label: "Health insurance", value: "health" },
						{ label: "401(k) match", value: "401k" },
						{ label: "Remote stipend", value: "remote" },
					]}
				/>
			</FormSection>

			<FormSection title="Compensation" description="Start date and pay.">
				<FormRow>
					<div>
						<label htmlFor="employee-start-date">Start date</label>
						<DateInput id="employee-start-date" name="startDate" />
					</div>
					<div>
						<label htmlFor="employee-salary">Salary</label>
						<NumberInput id="employee-salary" name="salary" min={0} step={1000} />
					</div>
				</FormRow>
			</FormSection>

			<div style={{ marginTop: "2rem" }}>
				<SubmitButton onSubmitValues={(values) => setSubmitted(values)}>Save employee</SubmitButton>
			</div>

			{submitted && <pre>{JSON.stringify(submitted, null, 2)}</pre>}
		</form>
	);
}
