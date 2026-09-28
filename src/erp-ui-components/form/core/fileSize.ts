/**
 * Byte counts as text.
 *
 * A context-free function that was living inside `FileInput.tsx` — nothing about
 * it is specific to a file input, or to React, or to this library.
 */

/**
 * A byte count in the units an operating system would use for the same file.
 *
 * 1 kB is 1024 B here, not 1000. Strictly that is a kibibyte, and strictly the
 * label should read `KiB` — but the user is about to compare this number with what
 * their file manager showed them, and Windows, macOS and every mail client all
 * report 1024-based sizes under the `kB`/`MB` labels. Being pedantically correct
 * here would mean disagreeing with every other number on the screen.
 *
 * One decimal below 10 (`9.4 MB`), none above it (`94 MB`) — enough precision to be
 * useful without implying the number is exact.
 */
export function formatFileSize(bytes: number): string {
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

	const rounded = size < 10 ? size.toFixed(1) : Math.round(size).toString()

	return `${rounded} ${units[unitIndex]}`
}
