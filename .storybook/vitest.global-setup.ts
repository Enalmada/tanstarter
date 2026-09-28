// Safety net for the Vitest 4 browser-mode + Playwright teardown hang
// (ported from UseFrank/frank#12). Browser mode occasionally leaves a
// Playwright CDP handle holding the event loop open after every test has
// passed, so CI idles until the job timeout.
//
// The unref'd timer is a no-op in the happy path: if nothing else keeps the
// process alive, Vitest exits normally. Otherwise it fires after the grace
// period, reports what is still open and force-exits with Vitest's exit code.

export default function setup() {
	return () => {
		const GRACE_PERIOD_MS = 30_000;

		const timer = setTimeout(() => {
			const handles = process.getActiveResourcesInfo?.() ?? [];
			// biome-ignore lint/suspicious/noConsole: test-runner diagnostics
			console.warn(
				`[vitest-teardown-safety-net] Teardown exceeded ${GRACE_PERIOD_MS}ms, force-exiting. ` +
					`Active handles: ${handles.join(", ") || "(none reported)"}`,
			);
			// Keep a failed run failing: process.exit() with no argument would
			// clobber the exitCode Vitest set.
			process.exit(process.exitCode ?? 0);
		}, GRACE_PERIOD_MS);

		timer.unref();
	};
}
