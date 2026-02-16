export type Snapshot = {
	/** Used heap size in bytes. */
	readonly usedHeapSize: number;

	/** Total heap size in bytes. */
	readonly totalHeapSize: number;

	/** Iteration number (0 = initial). */
	readonly iteration: number;
};

export type MemcheckResult = {
	/** Whether a memory leak was detected. */
	readonly leaked: boolean;

	/** Array of heap snapshots taken during the check. */
	readonly snapshots: Snapshot[];

	/** Percentage growth as a decimal (e.g., 0.1 = 10%). */
	readonly growth: number;
};

export type MemcheckOptions = {
	/**
	Number of snapshot cycles to run.
	@default 5
	*/
	readonly iterations?: number;

	/**
	Force garbage collection between iterations (requires `--expose-gc` or `global.gc` to be available).
	@default true
	*/
	readonly gcBetweenIterations?: boolean;

	/**
	Maximum allowed heap growth as a decimal (e.g., 0.1 = 10%).
	@default 0.1
	*/
	readonly allowedGrowth?: number;
};

/**
Run a scenario function multiple times and detect memory leaks by monitoring heap growth.

@param scenario - An async function that performs the operation to test.
@param options - Configuration options.
@returns The memcheck result with leak detection, snapshots, and growth metrics.

@example
```
import memcheck from 'memcheck-node';

const result = await memcheck(async () => {
	const data = Array.from({length: 1000}, (_, i) => ({id: i}));
	JSON.stringify(data);
});

console.log(result.leaked);
// => false
```
*/
export default function memcheck(scenario: () => Promise<void> | void, options?: MemcheckOptions): Promise<MemcheckResult>;

/**
Format a memcheck result as a human-readable report.

@param result - The memcheck result to format.
@returns A formatted report string.

@example
```
import memcheck, {formatReport} from 'memcheck-node';

const result = await memcheck(async () => {});
console.log(formatReport(result));
```
*/
export function formatReport(result: MemcheckResult): string;

/**
Run memcheck and throw an error if a memory leak is detected.

@param scenario - An async function that performs the operation to test.
@param options - Configuration options.
@returns The memcheck result if no leak is detected.
@throws If a memory leak is detected.

@example
```
import {assertNoLeaks} from 'memcheck-node';

await assertNoLeaks(async () => {
	// Your scenario here
});
```
*/
export function assertNoLeaks(scenario: () => Promise<void> | void, options?: MemcheckOptions): Promise<MemcheckResult>;
