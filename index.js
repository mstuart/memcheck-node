import v8 from 'node:v8';

function getHeapSnapshot() {
	const stats = v8.getHeapStatistics();
	return {
		usedHeapSize: stats.used_heap_size,
		totalHeapSize: stats.total_heap_size,
	};
}

function tryGc() {
	if (typeof globalThis.gc === 'function') {
		globalThis.gc();
	}
}

export default async function memcheck(scenario, options = {}) {
	const {
		iterations = 5,
		gcBetweenIterations = true,
		allowedGrowth = 0.1,
	} = options;

	// Warmup: run scenario a few times to stabilize
	for (let i = 0; i < 3; i++) {
		// eslint-disable-next-line no-await-in-loop
		await scenario();
	}

	if (gcBetweenIterations) {
		tryGc();
	}

	const snapshots = [];

	// Take initial snapshot
	const initial = getHeapSnapshot();
	snapshots.push({
		...initial,
		iteration: 0,
	});

	for (let i = 1; i <= iterations; i++) {
		// eslint-disable-next-line no-await-in-loop
		await scenario();

		if (gcBetweenIterations) {
			tryGc();
		}

		const snapshot = getHeapSnapshot();
		snapshots.push({
			...snapshot,
			iteration: i,
		});
	}

	const firstSnapshot = snapshots[0];
	const lastSnapshot = snapshots.at(-1);

	const growth = firstSnapshot.usedHeapSize === 0
		? 0
		: (lastSnapshot.usedHeapSize - firstSnapshot.usedHeapSize) / firstSnapshot.usedHeapSize;

	// Check for consistent growth trend
	let growingCount = 0;
	for (let i = 1; i < snapshots.length; i++) {
		if (snapshots[i].usedHeapSize > snapshots[i - 1].usedHeapSize) {
			growingCount++;
		}
	}

	const consistentGrowth = growingCount > snapshots.length / 2;
	const leaked = consistentGrowth && growth > allowedGrowth;

	return {
		leaked,
		snapshots,
		growth,
	};
}

export function formatReport(result) {
	const lines = [
		'Memory Check Report',
		'='.repeat(50),
		'',
		`Result: ${result.leaked ? 'LEAK DETECTED' : 'CLEAN'}`,
		`Growth: ${(result.growth * 100).toFixed(2)}%`,
		'',
		'Snapshots:',
	];

	for (const snapshot of result.snapshots) {
		const heapMb = (snapshot.usedHeapSize / (1024 * 1024)).toFixed(2);
		lines.push(`  Iteration ${snapshot.iteration}: ${heapMb} MB used heap`);
	}

	lines.push('');
	return lines.join('\n');
}

export async function assertNoLeaks(scenario, options = {}) {
	const result = await memcheck(scenario, options);

	if (result.leaked) {
		throw new Error(
			`Memory leak detected: heap grew by ${(result.growth * 100).toFixed(2)}% over ${result.snapshots.length - 1} iterations`,
		);
	}

	return result;
}
