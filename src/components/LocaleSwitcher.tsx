import { useLingui } from "@lingui/react/macro";
import { useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
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

	async function onChange(value: string) {
		if (!isLocale(value) || value === i18n.locale) return;
		await Promise.all([saveLocale({ data: value }), dynamicActivate(i18n, value)]);
		await router.invalidate();
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
