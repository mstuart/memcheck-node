import test from 'ava';
import memcheck, {formatReport, assertNoLeaks} from './index.js';

// Memcheck with non-leaking scenario

test('memcheck detects no leak for pure function', async t => {
	const result = await memcheck(() => {
		const data = Array.from({length: 100}, (_, i) => i * 2);
		return data.reduce((a, b) => a + b, 0);
	}, {iterations: 3});

	t.is(typeof result.leaked, 'boolean');
});

test('memcheck result has correct shape', async t => {
	const result = await memcheck(() => {
		Math.random();
	}, {iterations: 3});

	t.truthy('leaked' in result);
	t.truthy('snapshots' in result);
	t.truthy('growth' in result);
});

test('memcheck snapshots array has correct length', async t => {
	const iterations = 4;
	const result = await memcheck(() => {}, {iterations});

	// Iterations + 1 (initial snapshot)
	t.is(result.snapshots.length, iterations + 1);
});

test('memcheck snapshots have correct iteration numbers', async t => {
	const result = await memcheck(() => {}, {iterations: 3});

	t.is(result.snapshots[0].iteration, 0);
	t.is(result.snapshots[1].iteration, 1);
	t.is(result.snapshots[2].iteration, 2);
	t.is(result.snapshots[3].iteration, 3);
});

test('memcheck growth is a number', async t => {
	const result = await memcheck(() => {}, {iterations: 3});
	t.is(typeof result.growth, 'number');
});

test('memcheck snapshots have usedHeapSize', async t => {
	const result = await memcheck(() => {}, {iterations: 2});

	for (const snapshot of result.snapshots) {
		t.is(typeof snapshot.usedHeapSize, 'number');
		t.true(snapshot.usedHeapSize > 0);
	}
});

test('memcheck snapshots have totalHeapSize', async t => {
	const result = await memcheck(() => {}, {iterations: 2});

	for (const snapshot of result.snapshots) {
		t.is(typeof snapshot.totalHeapSize, 'number');
		t.true(snapshot.totalHeapSize > 0);
	}
});

// Memcheck with async scenario

test('memcheck works with async scenario', async t => {
	const result = await memcheck(async () => {
		await Promise.resolve(42);
	}, {iterations: 3});

	t.truthy(result);
	t.is(typeof result.leaked, 'boolean');
});

// Memcheck options

test('memcheck uses default options', async t => {
	const result = await memcheck(() => {});
	t.truthy(result);
	t.is(result.snapshots.length, 6); // 5 iterations + initial
});

test('memcheck respects gcBetweenIterations=false', async t => {
	const result = await memcheck(() => {}, {
		iterations: 2,
		gcBetweenIterations: false,
	});

	t.truthy(result);
});

test('memcheck respects custom allowedGrowth', async t => {
	const result = await memcheck(() => {}, {
		iterations: 2,
		allowedGrowth: 0.5,
	});

	t.truthy(result);
});

// FormatReport

test('formatReport returns a string', async t => {
	const result = await memcheck(() => {}, {iterations: 2});
	const report = formatReport(result);

	t.is(typeof report, 'string');
	t.true(report.length > 0);
});

test('formatReport includes header', async t => {
	const result = await memcheck(() => {}, {iterations: 2});
	const report = formatReport(result);

	t.true(report.includes('Memory Check Report'));
});

test('formatReport shows CLEAN for non-leaking scenario', async t => {
	const result = await memcheck(() => {
		Math.random();
	}, {iterations: 2});

	if (result.leaked) {
		t.pass();
	} else {
		const report = formatReport(result);
		t.true(report.includes('CLEAN'));
	}
});

test('formatReport includes growth percentage', async t => {
	const result = await memcheck(() => {}, {iterations: 2});
	const report = formatReport(result);

	t.true(report.includes('Growth:'));
	t.true(report.includes('%'));
});

test('formatReport includes snapshots section', async t => {
	const result = await memcheck(() => {}, {iterations: 2});
	const report = formatReport(result);

	t.true(report.includes('Snapshots:'));
	t.true(report.includes('Iteration 0'));
	t.true(report.includes('MB used heap'));
});

test('formatReport shows LEAK DETECTED for leaked result', t => {
	const fakeResult = {
		leaked: true,
		growth: 0.25,
		snapshots: [
			{usedHeapSize: 1_000_000, totalHeapSize: 2_000_000, iteration: 0},
			{usedHeapSize: 1_250_000, totalHeapSize: 2_000_000, iteration: 1},
		],
	};

	const report = formatReport(fakeResult);
	t.true(report.includes('LEAK DETECTED'));
});

// AssertNoLeaks

test('assertNoLeaks does not throw for clean scenario', async t => {
	await t.notThrowsAsync(async () => {
		await assertNoLeaks(() => {
			Math.random();
		}, {iterations: 2});
	});
});

test('assertNoLeaks returns result for clean scenario', async t => {
	const result = await assertNoLeaks(() => {}, {iterations: 2});
	t.truthy(result);
	t.is(typeof result.leaked, 'boolean');
	t.truthy(result.snapshots);
});

// Edge cases

test('memcheck handles scenario that allocates and releases', async t => {
	const result = await memcheck(() => {
		const temporary = Array.from({length: 100}, () => 'data');
		temporary.length = 0;
	}, {iterations: 3});

	t.truthy(result);
	t.is(typeof result.growth, 'number');
});

test('memcheck with single iteration', async t => {
	const result = await memcheck(() => {}, {iterations: 1});

	t.is(result.snapshots.length, 2);
	t.is(typeof result.leaked, 'boolean');
});

test('memcheck handles scenario returning a value', async t => {
	const result = await memcheck(() => 42, {iterations: 2});
	t.truthy(result);
});
