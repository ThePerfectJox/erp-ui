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

// End-to-end example — render it from a route/screen to try the fields by
// hand. Every field is an ordinary native form control; SubmitButton reads
// the owning <form> and hands back a plain object built from FormData.
export default function FormExample() {
	const [submitted, setSubmitted] = useState<FormValues | null>(null);

	return (
		<form style={{ maxWidth: "640px" }}>
			<FormSection title="Personal details" description="Basic information about the employee.">
				<FormRow>
					<TextInput name="name" label="Name" placeholder="Jane Doe" required />
					<Combobox name="department" label="Department" options={departments} placeholder="Start typing..." />
				</FormRow>
				<TextArea name="notes" label="Notes" hint="Anything worth flagging for HR." placeholder="Optional notes" />
			</FormSection>

			<FormSection title="Employment" description="Type and benefits.">
				<RadioGroup
					name="employmentType"
					label="Employment type"
					defaultValue="full-time"
					options={[
						{ label: "Full-time", value: "full-time" },
						{ label: "Part-time", value: "part-time" },
						{ label: "Contractor", value: "contractor" },
					]}
				/>
				<CheckboxGroup
					name="benefits"
					label="Benefits"
					hint="Select all that apply."
					options={[
						{ label: "Health insurance", value: "health" },
						{ label: "401(k) match", value: "401k" },
						{ label: "Remote stipend", value: "remote" },
					]}
				/>
			</FormSection>

			<FormSection title="Compensation" description="Start date and pay.">
				<FormRow>
					<DateInput name="startDate" label="Start date" />
					<NumberInput name="salary" label="Salary" hint="Annual, before tax." min={0} step={1000} />
				</FormRow>
			</FormSection>

			<div style={{ marginTop: "2rem" }}>
				<SubmitButton label="Save employee" onSubmitValues={(values) => setSubmitted(values)} />
			</div>

			{submitted && <pre>{JSON.stringify(submitted, null, 2)}</pre>}
		</form>
	);
}
