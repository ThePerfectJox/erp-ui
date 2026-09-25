import { useState } from 'react'
import type { ChangeEvent } from 'react'
import FormField from './FormField'
import { splitFieldProps, useFormField } from './useFormField'
import type { FieldBaseProps, PassthroughInputProps } from './FieldTypes'

interface FileInputProps extends FieldBaseProps, Omit<PassthroughInputProps, 'value' | 'defaultValue'> {
	/**
	 * Lists the chosen files under the control, with their sizes. On by
	 * default: a native file input truncates to "3 files", and on a screen
	 * where someone is attaching an invoice scan, knowing *which* three matters.
	 */
	hasFileList?: boolean
}

/** 1 kB as 1024 B, matching what an operating system reports for the same file. */
function formatFileSize(bytes: number): string {
	if (bytes < 1024) {
		return `${bytes} B`
	}

	const units = ['kB', 'MB', 'GB']
	let size = bytes / 1024
	let unitIndex = 0

	while (size >= 1024 && unitIndex < units.length - 1) {
		size /= 1024
		unitIndex += 1
	}

	/* One decimal below 10 (9.4 MB), none above it (94 MB) — enough precision
	 * to be useful without implying the number is exact. */
	const rounded = size < 10 ? size.toFixed(1) : Math.round(size).toString()

	return `${rounded} ${units[unitIndex]}`
}

/**
 * File attachment.
 *
 * ```tsx
 * <FileInput
 *     label="Supplier invoice"
 *     accept="application/pdf,image/*"
 *     hint="PDF or image, up to 10 MB."
 *     onChange={event => setFiles(event.target.files)}
 * />
 *
 * <FileInput label="Supporting documents" multiple />
 * ```
 *
 * A real `<input type="file">` underneath, styled through
 * `::file-selector-button`. The alternative — hiding the input and driving it
 * from a button — breaks keyboard focus and drag-and-drop often enough that it
 * is not worth the tidier markup.
 *
 * Two things this does not do, deliberately: it cannot be controlled (a file
 * input's value is not settable from script, by design — otherwise a page could
 * choose your files for you), and it does not enforce `accept` or any size
 * limit. `accept` filters the OS picker and is trivially bypassed, so validate
 * on the server and report the result through `valueState`.
 */
function FileInput({ hasFileList = true, onChange, ...props }: FileInputProps) {
	const [field, nativeProps] = splitFieldProps(props)
	const { fieldProps, controlProps } = useFormField(field)

	const [selectedFiles, setSelectedFiles] = useState<File[]>([])

	const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
		/* `event.target.files` is a live FileList, so it is copied into a plain
		 * array before going into state — holding the FileList itself would
		 * give React a value that can change without a re-render. */
		setSelectedFiles(event.target.files ? Array.from(event.target.files) : [])
		onChange?.(event)
	}

	/* `readOnly` does nothing on a file input, so an unchangeable attachment is
	 * a disabled one. It stays visible and its name is still listed below. */
	const { readOnly, ...fileProps } = controlProps

	return (
		<FormField {...fieldProps}>
			<input
				{...nativeProps}
				{...fileProps}
				type="file"
				className="form-control form-control-file"
				disabled={fileProps.disabled || readOnly}
				onChange={handleChange}
			/>
			{hasFileList && selectedFiles.length > 0 && (
				<ul className="form-file-list">
					{selectedFiles.map(file => (
						<li className="form-file-list-item" key={`${file.name}-${file.lastModified}`}>
							<span className="form-file-name">{file.name}</span>
							<span className="form-file-size">{formatFileSize(file.size)}</span>
						</li>
					))}
				</ul>
			)}
		</FormField>
	)
}

export default FileInput
