import { expectError, expectType } from "tsd";
import memcheck, {
  assertNoLeaks,
  formatReport,
  type MemcheckResult,
  type Snapshot,
} from "./index.js";

// Memcheck returns Promise<MemcheckResult>
const result = await memcheck(async () => {
  /* Scenario */
});
expectType<MemcheckResult>(result);
expectType<boolean>(result.leaked);
expectType<Snapshot[]>(result.snapshots);
expectType<number>(result.growth);

// Snapshot shape
const [snapshot] = result.snapshots;
expectType<number>(snapshot.usedHeapSize);
expectType<number>(snapshot.totalHeapSize);
expectType<number>(snapshot.iteration);

// Memcheck with options
expectType<Promise<MemcheckResult>>(
  memcheck(
    async () => {
      /* Scenario */
    },
    {
      allowedGrowth: 0.2,
      gcBetweenIterations: false,
      iterations: 10,
    }
  )
);

// Memcheck with a sync scenario
expectType<Promise<MemcheckResult>>(
  memcheck(() => {
    /* Scenario */
  })
);

// FormatReport returns a string
expectType<string>(formatReport(result));

// AssertNoLeaks returns Promise<MemcheckResult>
expectType<Promise<MemcheckResult>>(
  assertNoLeaks(async () => {
    /* Scenario */
  })
);
expectType<Promise<MemcheckResult>>(
  assertNoLeaks(
    async () => {
      /* Scenario */
    },
    { iterations: 3 }
  )
);

// Requires a scenario argument
expectError(memcheck());
expectError(assertNoLeaks());
