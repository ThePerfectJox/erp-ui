/**
 * Column type tag.
 *
 * - `"unknown"` means no non-empty value has been observed yet, so the type is
 *   still undetermined. It is not an error state.
 * - `"mixed"` means conflicting types were observed in the same column.
 * - `"object"` is the catch-all for values with no scalar tag (plain objects,
 *   arrays, functions, symbols).
 * - `"enum"` is never inferred; it only appears when declared explicitly.
 */
export type DataType =
    | "string"
    | "number"
    | "boolean"
    | "date"
    | "enum"
    | "object"
    | "mixed"
    | "unknown";

/** A single record, keyed by column name. */
export type DataFrameRow = Record<string, unknown>;

export type SortDirection = "asc" | "desc";

/** Where empty cells (`null` / `undefined`) land in a sort. */
export type NullOrdering = "first" | "last";

/** Declares a column up front instead of letting its type be inferred. */
export interface ColumnDefinition {
    /** Column name. Must be a non-empty string. */
    name: string;
    /**
     * Authoritative type for the column. When set to anything other than
     * `"unknown"` it wins over inference and is carried into derived frames
     * (`select`, `filter`, `sortBy`, `head`, `tail`, `clone`).
     */
    type?: DataType;
    /** Value used when a row omits this column. Defaults to `null`. */
    defaultValue?: unknown;
}

export interface SortOptions {
    /**
     * Where unorderable cells go: `null`, `undefined`, `NaN` and invalid
     * `Date`s. Defaults to `"last"` and is deliberately not flipped by the sort
     * direction, so blanks stay out of the way when sorting either way.
     */
    nulls?: NullOrdering;
    /**
     * Compare strings with natural number ordering so `"item 2"` sorts before
     * `"item 10"`. Defaults to `true`. Pass `false` for raw code point order.
     */
    numericStrings?: boolean;
}

/** Thrown for every invalid DataFrame operation, so callers can catch narrowly. */
export class DataFrameError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "DataFrameError";
    }
}

//#region MODULE HELPERS

const DATA_TYPE_TAGS: ReadonlySet<string> = new Set([
    "string",
    "number",
    "boolean",
    "date",
    "enum",
    "object",
    "mixed",
    "unknown",
]);

/**
 * Assigning to this key through a computed member access runs the
 * `Object.prototype` setter and rewrites the row's prototype, so it can never
 * be used as a column name.
 */
const UNSAFE_COLUMN_NAME = "__proto__";

/** Sort bucket for a value, used to keep mixed-type columns totally ordered. */
type ValueKind = "number" | "boolean" | "date" | "string" | "other";

const KIND_RANK: Record<ValueKind, number> = {
    number: 0,
    boolean: 1,
    date: 2,
    string: 3,
    other: 4,
};

let numericCollator: Intl.Collator | null = null;

/** Built once and reused; constructing a collator per comparison is costly. */
function getNumericCollator(): Intl.Collator {
    numericCollator ??= new Intl.Collator(undefined, { numeric: true });

    return numericCollator;
}

function hasOwn(target: object, key: string): boolean {
    return Object.prototype.hasOwnProperty.call(target, key);
}

function isPlainRecord(value: unknown): value is DataFrameRow {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}

function validateColumnName(name: unknown): string {
    if (typeof name !== "string") {
        throw new DataFrameError(
            `Column names must be strings, received ${typeof name}.`
        );
    }

    if (name.trim().length === 0) {
        throw new DataFrameError(
            "Column names must not be empty or whitespace only."
        );
    }

    if (name === UNSAFE_COLUMN_NAME) {
        throw new DataFrameError(
            `"${UNSAFE_COLUMN_NAME}" is not a valid column name.`
        );
    }

    return name;
}

function validateDataType(dataType: unknown): DataType {
    if (typeof dataType !== "string" || !DATA_TYPE_TAGS.has(dataType)) {
        throw new DataFrameError(
            `Unsupported column type "${String(dataType)}".`
        );
    }

    return dataType as DataType;
}

function normalizeColumnDefinition(
    definition: string | ColumnDefinition
): ColumnDefinition {
    if (typeof definition === "string") {
        return { name: validateColumnName(definition) };
    }

    if (!isPlainRecord(definition)) {
        throw new DataFrameError(
            "Column definitions must be a string or an object with a name."
        );
    }

    const candidate = definition as ColumnDefinition;

    return {
        name: validateColumnName(candidate.name),
        type: candidate.type,
        defaultValue: candidate.defaultValue,
    };
}

/** Clamps a requested row count to `[0, total]`, rejecting nonsense input. */
function clampRowCount(value: unknown, total: number): number {
    if (typeof value !== "number" || !Number.isFinite(value)) {
        throw new DataFrameError(
            `Row count must be a finite number, received ${String(value)}.`
        );
    }

    const truncated = Math.trunc(value);

    if (truncated < 0) {
        throw new DataFrameError(
            `Row count must not be negative, received ${truncated}.`
        );
    }

    return Math.min(truncated, total);
}

function detectDataType(value: unknown): DataType {
    if (value === null || value === undefined) {
        return "unknown";
    }

    if (value instanceof Date) {
        return "date";
    }

    switch (typeof value) {
        case "string":
            return "string";

        case "number":
        case "bigint":
            return "number";

        case "boolean":
            return "boolean";

        default:
            return "object";
    }
}

/**
 * True for values with no meaningful position in a sort: empty cells, `NaN` and
 * invalid `Date`s. They are grouped with nulls rather than compared, so a
 * descending sort does not float bad data to the top.
 */
function isUnorderable(value: unknown): boolean {
    if (value === null || value === undefined) {
        return true;
    }

    if (typeof value === "number") {
        return Number.isNaN(value);
    }

    if (value instanceof Date) {
        return Number.isNaN(value.getTime());
    }

    return false;
}

function valueKind(value: unknown): ValueKind {
    if (value instanceof Date) {
        return "date";
    }

    switch (typeof value) {
        case "number":
        case "bigint":
            return "number";

        case "boolean":
            return "boolean";

        case "string":
            return "string";

        default:
            return "other";
    }
}

/** Numeric compare that pushes `NaN` (and invalid dates) to the end. */
function compareNumeric(
    left: number | bigint,
    right: number | bigint
): number {
    const leftIsNaN = typeof left === "number" && Number.isNaN(left);
    const rightIsNaN = typeof right === "number" && Number.isNaN(right);

    if (leftIsNaN || rightIsNaN) {
        return Number(leftIsNaN) - Number(rightIsNaN);
    }

    if (left < right) {
        return -1;
    }

    if (left > right) {
        return 1;
    }

    return 0;
}

function compareRaw(left: string, right: string): number {
    if (left < right) {
        return -1;
    }

    if (left > right) {
        return 1;
    }

    return 0;
}

function toComparableString(value: unknown): string {
    try {
        return String(value);
    } catch {
        // Symbols and null-prototype objects have no usable string form.
        return "";
    }
}

/**
 * Total ordering over arbitrary cell values: equal values always return 0 and
 * the relation is transitive, which `Array.prototype.sort` requires to produce
 * a defined result. Differing types are ordered by {@link KIND_RANK} so a
 * mixed column still sorts deterministically instead of by insertion luck.
 */
function compareValues(
    left: unknown,
    right: unknown,
    collator: Intl.Collator | null
): number {
    const leftKind = valueKind(left);
    const rightKind = valueKind(right);

    if (leftKind !== rightKind) {
        return KIND_RANK[leftKind] - KIND_RANK[rightKind];
    }

    switch (leftKind) {
        case "number":
            return compareNumeric(
                left as number | bigint,
                right as number | bigint
            );

        case "boolean":
            return Number(left as boolean) - Number(right as boolean);

        case "date":
            return compareNumeric(
                (left as Date).getTime(),
                (right as Date).getTime()
            );

        case "string":
            return collator
                ? collator.compare(left as string, right as string)
                : compareRaw(left as string, right as string);

        default:
            return compareRaw(
                toComparableString(left),
                toComparableString(right)
            );
    }
}

/**
 * Copies a default value so one object default is not shared by reference
 * across every row.
 */
function cloneDefaultValue(value: unknown): unknown {
    if (value === null || typeof value !== "object") {
        return value;
    }

    if (value instanceof Date) {
        return new Date(value.getTime());
    }

    try {
        return structuredClone(value);
    } catch {
        // Functions and class instances are not cloneable; sharing the
        // reference is the best available fallback.
        return value;
    }
}

function moveMapEntry<TValue>(
    map: Map<string, TValue>,
    fromKey: string,
    toKey: string
): void {
    if (!map.has(fromKey)) {
        return;
    }

    map.set(toKey, map.get(fromKey) as TValue);
    map.delete(fromKey);
}

//#endregion

/**
 * A lightweight in-memory table: an ordered list of columns plus an ordered
 * list of rows normalized against those columns.
 *
 * Mutation model:
 * - `addColumn`, `removeColumn`, `renameColumn`, `setColumnType`, `addRow`,
 *   `addRows`, `updateRow`, `setValue` and `removeRow` mutate this frame.
 * - `select`, `filter`, `sortBy`, `head`, `tail` and `clone` leave this frame
 *   untouched and return a new one, carrying declared column types and
 *   defaults forward.
 *
 * Internal rows are never handed out: reads return shallow copies, so mutating
 * a returned row cannot corrupt the frame. Objects and `Date` values stored
 * inside a cell are still shared by reference, so treat cell contents as
 * read-only.
 *
 * @example
 * ```ts
 * const stock = new DataFrame(
 *     [{ name: "sku", type: "string" }, { name: "onHand", defaultValue: 0 }],
 *     [{ sku: "A-100", onHand: 12 }, { sku: "A-101" }]
 * );
 *
 * stock.sortBy("onHand", "desc").toArray();
 * ```
 */
export class DataFrame {
    //#region FIELDS

    /** Column names in display order. */
    private columns: string[];
    /** Column name to its index in `columns`, for O(1) existence checks. */
    private columnPositions: Map<string, number>;
    /** Explicit types, which win over inference. Absent means "infer". */
    private declaredTypes: Map<string, DataType>;
    /** Value substituted when a row omits a column. */
    private columnDefaults: Map<string, unknown>;
    /**
     * Per-column histogram of observed non-empty types, maintained
     * incrementally so a row edit never triggers a full table rescan.
     */
    private typeCounts: Map<string, Map<DataType, number>>;
    private data: DataFrameRow[];

    //#endregion

    //#region CONSTRUCTION

    /**
     * @param columns Column names, or definitions that declare types/defaults.
     * @param rows Initial rows. Keys that are not columns are ignored; use
     *             {@link DataFrame.fromRecords} to derive columns from data.
     * @throws {DataFrameError} On duplicate, empty or non-string column names.
     */
    constructor(
        columns: readonly (string | ColumnDefinition)[] = [],
        rows: readonly DataFrameRow[] = []
    ) {
        this.columns = [];
        this.columnPositions = new Map<string, number>();
        this.declaredTypes = new Map<string, DataType>();
        this.columnDefaults = new Map<string, unknown>();
        this.typeCounts = new Map<string, Map<DataType, number>>();
        this.data = [];

        if (!Array.isArray(columns)) {
            throw new DataFrameError("Columns must be an array.");
        }

        for (const definition of columns) {
            const normalized = normalizeColumnDefinition(definition);

            this.registerColumn(
                normalized.name,
                normalized.type,
                normalized.defaultValue
            );
        }

        this.addRows(rows);
    }

    /**
     * Builds a frame from records, deriving the column set from the union of
     * their keys in first-seen order. Unlike the constructor this discards no
     * data. A literal `__proto__` key is skipped as unsafe.
     */
    public static fromRecords(
        records: readonly DataFrameRow[]
    ): DataFrame {
        if (!Array.isArray(records)) {
            throw new DataFrameError(
                "fromRecords expects an array of objects."
            );
        }

        const columns: string[] = [];
        const seen = new Set<string>();

        for (const record of records) {
            if (!isPlainRecord(record)) {
                throw new DataFrameError(
                    "fromRecords expects an array of plain objects."
                );
            }

            for (const key of Object.keys(record)) {
                if (key === UNSAFE_COLUMN_NAME || seen.has(key)) {
                    continue;
                }

                seen.add(key);
                columns.push(key);
            }
        }

        return new DataFrame(columns, records);
    }

    /** Independent copy: same columns, types, defaults and rows. */
    public clone(): DataFrame {
        return this.derive(this.columns, this.toArray());
    }

    //#endregion

    //#region COLUMN METHODS

    public getColumns(): string[] {
        return [...this.columns];
    }

    public hasColumn(columnName: string): boolean {
        return (
            typeof columnName === "string" &&
            this.columnPositions.has(columnName)
        );
    }

    /** Effective type of a column: the declared type, otherwise the inferred one. */
    public getColumnType(columnName: string): DataType {
        this.assertColumn(columnName);

        return this.resolveColumnType(columnName);
    }

    /** Effective types for every column, in column order. */
    public getColumnTypes(): Record<string, DataType> {
        const types: Record<string, DataType> = {};

        for (const column of this.columns) {
            types[column] = this.resolveColumnType(column);
        }

        return types;
    }

    /**
     * Pins a column's type. Pass `null` (or `"unknown"`) to drop the
     * declaration and fall back to inference.
     */
    public setColumnType(
        columnName: string,
        dataType: DataType | null
    ): void {
        this.assertColumn(columnName);

        if (dataType === null || validateDataType(dataType) === "unknown") {
            this.declaredTypes.delete(columnName);

            return;
        }

        this.declaredTypes.set(columnName, dataType);
    }

    /**
     * Appends a column and backfills existing rows with `defaultValue`. The
     * default is remembered, so rows added later receive it too, and object
     * defaults are copied per row instead of shared.
     *
     * A `dataType` of `"unknown"` (the default) leaves the column inferred.
     */
    public addColumn(
        columnName: string,
        dataType: DataType = "unknown",
        defaultValue: unknown = null
    ): void {
        const name = this.registerColumn(
            columnName,
            dataType,
            defaultValue
        );

        for (const row of this.data) {
            row[name] = cloneDefaultValue(defaultValue);
        }

        this.countValue(name, defaultValue, this.data.length);
    }

    public removeColumn(columnName: string): void {
        this.assertColumn(columnName);

        this.columns = this.columns.filter(
            column => column !== columnName
        );

        this.declaredTypes.delete(columnName);
        this.columnDefaults.delete(columnName);
        this.typeCounts.delete(columnName);
        this.reindexColumns();

        for (const row of this.data) {
            delete row[columnName];
        }
    }

    /** Values of one column, in row order. */
    public getColumn(columnName: string): unknown[] {
        this.assertColumn(columnName);

        return this.data.map(row => row[columnName]);
    }

    /**
     * Renames a column in place, preserving its position, declared type,
     * default and the key order of every row. Renaming to the same name is a
     * no-op.
     */
    public renameColumn(
        oldColumnName: string,
        newColumnName: string
    ): void {
        this.assertColumn(oldColumnName);

        const nextName = validateColumnName(newColumnName);

        if (nextName === oldColumnName) {
            return;
        }

        if (this.columnPositions.has(nextName)) {
            throw new DataFrameError(
                `Column "${nextName}" already exists.`
            );
        }

        const position = this.columnPositions.get(oldColumnName) ?? 0;

        this.columns[position] = nextName;
        this.reindexColumns();

        moveMapEntry(this.declaredTypes, oldColumnName, nextName);
        moveMapEntry(this.columnDefaults, oldColumnName, nextName);
        moveMapEntry(this.typeCounts, oldColumnName, nextName);

        // Rows are rebuilt rather than patched so their key order still
        // matches `columns`, which grid renderers read to lay out headers.
        this.data = this.data.map(row => {
            const renamed: DataFrameRow = {};

            for (const column of this.columns) {
                renamed[column] =
                    column === nextName
                        ? row[oldColumnName]
                        : row[column];
            }

            return renamed;
        });
    }

    //#endregion

    //#region ROW METHODS

    /**
     * Appends a row normalized to the current columns. Absent keys fall back to
     * the column default (`null` unless declared otherwise); keys that are not
     * columns are ignored.
     */
    public addRow(row: DataFrameRow): void {
        const normalizedRow = this.buildRow(row);

        this.data.push(normalizedRow);

        for (const column of this.columns) {
            this.countValue(column, normalizedRow[column], 1);
        }
    }

    public addRows(rows: readonly DataFrameRow[]): void {
        if (!Array.isArray(rows)) {
            throw new DataFrameError("Rows must be an array.");
        }

        for (const row of rows) {
            this.addRow(row);
        }
    }

    /** Shallow copy of the row; mutating it does not affect the frame. */
    public getRow(index: number): DataFrameRow {
        this.assertRowIndex(index);

        return { ...this.data[index] };
    }

    public getValue(index: number, columnName: string): unknown {
        this.assertRowIndex(index);
        this.assertColumn(columnName);

        return this.data[index][columnName];
    }

    /** Writes a single cell. `undefined` is stored as `null`. */
    public setValue(
        index: number,
        columnName: string,
        value: unknown
    ): void {
        this.assertRowIndex(index);
        this.assertColumn(columnName);

        const row = this.data[index];
        const nextValue = value === undefined ? null : value;

        this.countValue(columnName, row[columnName], -1);
        row[columnName] = nextValue;
        this.countValue(columnName, nextValue, 1);
    }

    /**
     * Applies a partial update. Every key is validated before anything is
     * written, so an unknown column leaves the row untouched instead of
     * half-updated.
     */
    public updateRow(
        index: number,
        updatedValues: Partial<DataFrameRow>
    ): void {
        this.assertRowIndex(index);

        if (!isPlainRecord(updatedValues)) {
            throw new DataFrameError(
                "Updated values must be an object keyed by column name."
            );
        }

        const entries = Object.entries(updatedValues);

        for (const [column] of entries) {
            this.assertColumn(column);
        }

        const row = this.data[index];

        for (const [column, value] of entries) {
            const nextValue = value === undefined ? null : value;

            this.countValue(column, row[column], -1);
            row[column] = nextValue;
            this.countValue(column, nextValue, 1);
        }
    }

    public removeRow(index: number): void {
        this.assertRowIndex(index);

        const [removed] = this.data.splice(index, 1);

        for (const column of this.columns) {
            this.countValue(column, removed[column], -1);
        }
    }

    public rowCount(): number {
        return this.data.length;
    }

    public columnCount(): number {
        return this.columns.length;
    }

    public isEmpty(): boolean {
        return this.data.length === 0;
    }

    /** Yields shallow row copies, so `[...frame]` and `for...of` are safe. */
    public *[Symbol.iterator](): IterableIterator<DataFrameRow> {
        for (const row of this.data) {
            yield { ...row };
        }
    }

    //#endregion

    //#region QUERY METHODS

    /**
     * Projects a subset of columns into a new frame. Repeated names collapse to
     * a single column instead of producing a frame whose metadata disagrees
     * with its rows.
     */
    public select(...columnNames: string[]): DataFrame {
        if (columnNames.length === 0) {
            throw new DataFrameError(
                "select requires at least one column."
            );
        }

        const selected: string[] = [];
        const seen = new Set<string>();

        for (const columnName of columnNames) {
            this.assertColumn(columnName);

            if (seen.has(columnName)) {
                continue;
            }

            seen.add(columnName);
            selected.push(columnName);
        }

        const rows = this.data.map(row => {
            const projected: DataFrameRow = {};

            for (const columnName of selected) {
                projected[columnName] = row[columnName];
            }

            return projected;
        });

        return this.derive(selected, rows);
    }

    /**
     * Keeps the rows the predicate accepts. The predicate receives a copy, so
     * it cannot mutate this frame.
     */
    public filter(
        predicate: (
            row: Readonly<DataFrameRow>,
            index: number
        ) => boolean
    ): DataFrame {
        if (typeof predicate !== "function") {
            throw new DataFrameError("filter requires a predicate function.");
        }

        const rows: DataFrameRow[] = [];

        for (let index = 0; index < this.data.length; index += 1) {
            const candidate = { ...this.data[index] };

            if (predicate(candidate, index)) {
                rows.push(candidate);
            }
        }

        return this.derive(this.columns, rows);
    }

    /**
     * Stable sort on one column into a new frame.
     *
     * Empty cells are grouped by `options.nulls` (default `"last"`) rather than
     * being flipped by `direction`. Values of differing types are ordered by a
     * fixed type rank, so a mixed column still sorts deterministically.
     */
    public sortBy(
        columnName: string,
        direction: SortDirection = "asc",
        options: SortOptions = {}
    ): DataFrame {
        this.assertColumn(columnName);

        if (direction !== "asc" && direction !== "desc") {
            throw new DataFrameError(
                `Sort direction must be "asc" or "desc", received "${String(direction)}".`
            );
        }

        const nulls = options.nulls ?? "last";

        if (nulls !== "first" && nulls !== "last") {
            throw new DataFrameError(
                `Null ordering must be "first" or "last", received "${String(nulls)}".`
            );
        }

        const collator =
            options.numericStrings === false ? null : getNumericCollator();

        const nullRank = nulls === "first" ? -1 : 1;
        const directionFactor = direction === "asc" ? 1 : -1;

        const sorted = this.toArray().sort((rowA, rowB) => {
            const valueA = rowA[columnName];
            const valueB = rowB[columnName];

            const aIsEmpty = isUnorderable(valueA);
            const bIsEmpty = isUnorderable(valueB);

            if (aIsEmpty || bIsEmpty) {
                if (aIsEmpty && bIsEmpty) {
                    return 0;
                }

                return aIsEmpty ? nullRank : -nullRank;
            }

            return compareValues(valueA, valueB, collator) * directionFactor;
        });

        return this.derive(this.columns, sorted);
    }

    /** First `numberOfRows` rows. A count past the end simply returns all rows. */
    public head(numberOfRows: number = 5): DataFrame {
        const count = clampRowCount(numberOfRows, this.data.length);

        return this.derive(this.columns, this.copyRows(0, count));
    }

    /** Last `numberOfRows` rows. `tail(0)` returns an empty frame. */
    public tail(numberOfRows: number = 5): DataFrame {
        const count = clampRowCount(numberOfRows, this.data.length);

        return this.derive(
            this.columns,
            this.copyRows(this.data.length - count, count)
        );
    }

    //#endregion

    //#region CONVERSION METHODS

    /** Row copies, safe to mutate. */
    public toArray(): DataFrameRow[] {
        return this.data.map(row => ({ ...row }));
    }

    /**
     * Serialization hook for `JSON.stringify`. Returns the rows, so
     * `JSON.stringify(frame)` yields a plain array rather than a string of
     * escaped JSON. Use {@link DataFrame.toJSONString} for a formatted string.
     */
    public toJSON(): DataFrameRow[] {
        return this.toArray();
    }

    /** JSON text for the rows, indented by default. */
    public toJSONString(space: number | string = 2): string {
        return JSON.stringify(this.data, null, space);
    }

    /** Column names plus rows, for callers that need the shape as well as data. */
    public toObject(): {
        columns: string[];
        columnTypes: Record<string, DataType>;
        rows: DataFrameRow[];
    } {
        return {
            columns: this.getColumns(),
            columnTypes: this.getColumnTypes(),
            rows: this.toArray(),
        };
    }

    /** Debug dump, column order preserved. */
    public print(): void {
        if (this.columns.length === 0) {
            console.log("DataFrame: no columns.");

            return;
        }

        console.table(this.toArray(), this.columns);
    }

    public toString(): string {
        return `DataFrame(${this.columns.length} column(s), ${this.data.length} row(s))`;
    }

    //#endregion

    //#region PRIVATE METHODS

    private assertColumn(columnName: string): void {
        if (
            typeof columnName !== "string" ||
            !this.columnPositions.has(columnName)
        ) {
            const available =
                this.columns.length > 0
                    ? this.columns.join(", ")
                    : "(none)";

            throw new DataFrameError(
                `Column "${String(columnName)}" does not exist. Available: ${available}.`
            );
        }
    }

    private assertRowIndex(index: number): void {
        if (!Number.isInteger(index) || index < 0 || index >= this.data.length) {
            throw new DataFrameError(
                `Row index ${String(index)} is out of range; the frame has ${this.data.length} row(s).`
            );
        }
    }

    /** Adds column metadata without touching existing rows. */
    private registerColumn(
        columnName: string,
        dataType: DataType | undefined,
        defaultValue: unknown
    ): string {
        const name = validateColumnName(columnName);

        if (this.columnPositions.has(name)) {
            throw new DataFrameError(`Column "${name}" already exists.`);
        }

        if (
            dataType !== undefined &&
            validateDataType(dataType) !== "unknown"
        ) {
            this.declaredTypes.set(name, dataType);
        }

        this.columnPositions.set(name, this.columns.length);
        this.columns.push(name);
        this.columnDefaults.set(
            name,
            defaultValue === undefined ? null : defaultValue
        );
        this.typeCounts.set(name, new Map<DataType, number>());

        return name;
    }

    private reindexColumns(): void {
        this.columnPositions.clear();

        for (let index = 0; index < this.columns.length; index += 1) {
            this.columnPositions.set(this.columns[index], index);
        }
    }

    /**
     * Normalizes an arbitrary record into a row with exactly this frame's
     * columns, in column order. Only own properties count, so a column named
     * `"toString"` picks up its default instead of an inherited function.
     */
    private buildRow(row: DataFrameRow): DataFrameRow {
        if (!isPlainRecord(row)) {
            throw new DataFrameError(
                "Rows must be plain objects keyed by column name."
            );
        }

        const normalized: DataFrameRow = {};

        for (const column of this.columns) {
            const value = hasOwn(row, column) ? row[column] : undefined;

            normalized[column] =
                value === undefined
                    ? cloneDefaultValue(
                          this.columnDefaults.get(column) ?? null
                      )
                    : value;
        }

        return normalized;
    }

    /**
     * Adjusts a column's type histogram by `delta` occurrences of `value`.
     * Empty cells carry no type information and are skipped.
     */
    private countValue(
        columnName: string,
        value: unknown,
        delta: number
    ): void {
        if (delta === 0) {
            return;
        }

        const detected = detectDataType(value);

        if (detected === "unknown") {
            return;
        }

        const counts = this.typeCounts.get(columnName);

        if (!counts) {
            return;
        }

        const next = (counts.get(detected) ?? 0) + delta;

        if (next > 0) {
            counts.set(detected, next);
        } else {
            counts.delete(detected);
        }
    }

    /**
     * Declared type wins. Otherwise: no observations means `"unknown"`, one
     * observed type means that type, and several means `"mixed"`.
     */
    private resolveColumnType(columnName: string): DataType {
        const declared = this.declaredTypes.get(columnName);

        if (declared !== undefined) {
            return declared;
        }

        const counts = this.typeCounts.get(columnName);

        if (!counts || counts.size === 0) {
            return "unknown";
        }

        if (counts.size > 1) {
            return "mixed";
        }

        for (const type of counts.keys()) {
            return type;
        }

        return "unknown";
    }

    private copyRows(start: number, count: number): DataFrameRow[] {
        if (count <= 0) {
            return [];
        }

        return this.data
            .slice(start, start + count)
            .map(row => ({ ...row }));
    }

    /** New frame over a subset of this frame's columns, metadata preserved. */
    private derive(
        columns: readonly string[],
        rows: DataFrameRow[]
    ): DataFrame {
        const definitions: ColumnDefinition[] = columns.map(column => ({
            name: column,
            type: this.declaredTypes.get(column),
            defaultValue: this.columnDefaults.get(column) ?? null,
        }));

        return new DataFrame(definitions, rows);
    }

    //#endregion
}
