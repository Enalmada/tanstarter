import { useLingui } from "@lingui/react/macro";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useRef } from "react";
import { updateLocale } from "~/functions/locale";
import { dynamicActivate, isLocale, LOCALES } from "~/lib/i18n/locales";

/**
 * Switches the language without a full reload: loads the catalog, tells the
 * server to remember the choice (cookie), and re-runs the route loaders.
 */
export function LocaleSwitcher() {
	const { t, i18n } = useLingui();
	const router = useRouter();
	const saveLocale = useServerFn(updateLocale);

	// Only the latest selection wins when the user changes their mind mid-load: stale catalog
	// loads do not activate, and saves run one at a time so an older one cannot land last.
	const latest = useRef(0);
	const saves = useRef<Promise<unknown>>(Promise.resolve());

	async function onChange(value: string) {
		if (!isLocale(value)) return;
		const request = ++latest.current;
		const isLatest = () => request === latest.current;

		const save = saves.current.then(() => (isLatest() ? saveLocale({ data: value }) : undefined));
		saves.current = save.catch(() => undefined);

		await Promise.all([dynamicActivate(i18n, value, isLatest), save]);
		if (isLatest()) await router.invalidate();
	}

	return (
		<select
			aria-label={t`Language`}
			className="h-9 rounded-md border bg-background px-2 text-sm"
			value={i18n.locale}
			onChange={(event) => void onChange(event.target.value)}
		>
			{Object.entries(LOCALES).map(([code, name]) => (
				<option key={code} value={code}>
					{name}
				</option>
			))}
		</select>
	);
}
