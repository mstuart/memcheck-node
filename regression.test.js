import v8 from "node:v8";
import test from "ava";
import memcheck, { assertNoLeaks } from "./index.js";

async function withHeapSizes(sizes, callback) {
  const original = v8.getHeapStatistics;
  let index = 0;
  v8.getHeapStatistics = () => {
    const usedHeapSize = sizes[index];
    index += 1;
    return { total_heap_size: 1000, used_heap_size: usedHeapSize };
  };
  try {
    return await callback();
  } finally {
    v8.getHeapStatistics = original;
  }
}

test.serial("detects growth in a single measured interval", async (t) => {
  await withHeapSizes([100, 200], async () => {
    const result = await memcheck(() => undefined, {
      gcBetweenIterations: false,
      iterations: 1,
    });
    t.is(result.growth, 1);
    t.true(result.leaked);
  });
});

test.serial("detects a growing majority of measured intervals", async (t) => {
  await withHeapSizes([100, 160, 150, 200], async () => {
    await t.throwsAsync(
      assertNoLeaks(() => undefined, {
        gcBetweenIterations: false,
        iterations: 3,
      }),
      {
        message: "Memory leak detected: heap grew by 100.00% over 3 iterations",
      }
    );
  });
});

test.serial(
  "does not treat an evenly split trend as consistent growth",
  async (t) => {
    await withHeapSizes([100, 200, 150], async () => {
      const result = await memcheck(() => undefined, {
        gcBetweenIterations: false,
        iterations: 2,
      });
      t.false(result.leaked);
    });
  }
);

test("rejects invalid iteration counts before running a scenario", async (t) => {
  await Promise.all(
    [
      -1,
      0,
      1.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.MAX_SAFE_INTEGER + 1,
      "2",
    ].map(async (iterations) => {
      let calls = 0;
      await t.throwsAsync(
        memcheck(
          () => {
            calls += 1;
            throw new Error("scenario must not run");
          },
          { iterations }
        ),
        { instanceOf: TypeError }
      );
      t.is(calls, 0);
    })
  );
});

test("rejects invalid growth thresholds before running a scenario", async (t) => {
  await Promise.all(
    [
      -0.1,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      Number.NEGATIVE_INFINITY,
      "0.1",
    ].map(async (allowedGrowth) => {
      let calls = 0;
      await t.throwsAsync(
        assertNoLeaks(
          () => {
            calls += 1;
            throw new Error("scenario must not run");
          },
          { allowedGrowth }
        ),
        { instanceOf: TypeError }
      );
      t.is(calls, 0);
    })
  );
});
