import {expectType, expectError} from 'tsd';
import memcheck, {
	formatReport,
	assertNoLeaks,
	type MemcheckResult,
	type Snapshot,
} from './index.js';

// Memcheck returns Promise<MemcheckResult>
const result = await memcheck(async () => { /* Scenario */ });
expectType<MemcheckResult>(result);
expectType<boolean>(result.leaked);
expectType<Snapshot[]>(result.snapshots);
expectType<number>(result.growth);

// Snapshot shape
const snapshot = result.snapshots[0];
expectType<number>(snapshot.usedHeapSize);
expectType<number>(snapshot.totalHeapSize);
expectType<number>(snapshot.iteration);

// Memcheck with options
expectType<Promise<MemcheckResult>>(memcheck(async () => { /* Scenario */ }, {
	iterations: 10,
	gcBetweenIterations: false,
	allowedGrowth: 0.2,
}));

// Memcheck with sync scenario
expectType<Promise<MemcheckResult>>(memcheck(() => { /* Scenario */ }));

// FormatReport returns string
expectType<string>(formatReport(result));

// AssertNoLeaks returns Promise<MemcheckResult>
expectType<Promise<MemcheckResult>>(assertNoLeaks(async () => { /* Scenario */ }));
expectType<Promise<MemcheckResult>>(assertNoLeaks(async () => { /* Scenario */ }, {iterations: 3}));

// Requires scenario argument
expectError(memcheck());
expectError(assertNoLeaks());
