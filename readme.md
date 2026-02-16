# memcheck-node

> Automated memory leak regression testing for Node.js — detect growing object graphs in CI

## Install

```sh
npm install memcheck-node
```

## Usage

```js
import memcheck, {assertNoLeaks, formatReport} from 'memcheck-node';

// Check a scenario for memory leaks
const result = await memcheck(async () => {
	// Your scenario: e.g., handle an HTTP request
	const data = processRequest({id: 1});
	return data;
}, {
	iterations: 5,
	allowedGrowth: 0.1, // Allow up to 10% heap growth
});

console.log(result.leaked);
// => false

console.log(formatReport(result));

// Or use assertNoLeaks in your tests
await assertNoLeaks(async () => {
	// This will throw if a leak is detected
	processRequest({id: 1});
});
```

## API

### `memcheck(scenario, options?)`

Returns: `Promise<{leaked, snapshots, growth}>`

Run a scenario function multiple times and detect memory leaks by monitoring heap growth.

#### scenario

Type: `() => Promise<void> | void`

A function that performs the operation to test.

#### options

##### iterations

Type: `number`\
Default: `5`

Number of snapshot cycles to run.

##### gcBetweenIterations

Type: `boolean`\
Default: `true`

Force garbage collection between iterations. Requires `--expose-gc` flag or `global.gc` to be available.

##### allowedGrowth

Type: `number`\
Default: `0.1`

Maximum allowed heap growth as a decimal (0.1 = 10%).

#### Return value

- `leaked` — `true` if a memory leak was detected
- `snapshots` — Array of `{usedHeapSize, totalHeapSize, iteration}` objects
- `growth` — Percentage growth as a decimal

### `formatReport(result)`

Returns: `string`

Format a memcheck result as a human-readable report.

### `assertNoLeaks(scenario, options?)`

Returns: `Promise<MemcheckResult>`

Run memcheck and throw an error if a memory leak is detected. Useful in test suites.

## Related

- [v8](https://nodejs.org/api/v8.html) — Node.js V8 engine API

## License

MIT
