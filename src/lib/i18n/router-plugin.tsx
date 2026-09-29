/**
 * Wires a per-request Lingui instance into the router (adapted from the
 * official example, https://github.com/lingui/js-lingui/tree/main/examples/tanstack-start):
 * - wraps the app in I18nProvider,
 * - on the server, dehydrates `{ locale, messages }` into the page,
 * - in the browser, hydrates the instance from it before the first render, so
 *   the client renders the same language as the server (no hydration mismatch).
 */

import type { I18n, Messages } from "@lingui/core";
import { I18nProvider } from "@lingui/react";
import type { AnyRouter } from "@tanstack/react-router";
import { Fragment, type PropsWithChildren } from "react";

interface DehydratedI18n {
	locale: string;
	messages: Messages;
}

export function routerWithLingui<TRouter extends AnyRouter>(router: TRouter, i18n: I18n): TRouter {
	const ogOptions = router.options;

	router.options = {
		...router.options,
		Wrap: ({ children }: PropsWithChildren) => {
			const OGWrap = ogOptions.Wrap ?? Fragment;
			return (
				<I18nProvider i18n={i18n}>
					<OGWrap>{children}</OGWrap>
				</I18nProvider>
			);
		},
	};

	if (router.isServer) {
		router.options.dehydrate = async () => {
			const dehydrated = await ogOptions.dehydrate?.();
			return { ...dehydrated, dehydratedI18n: { locale: i18n.locale, messages: i18n.messages } as DehydratedI18n };
		};
	} else {
		router.options.hydrate = async (dehydrated) => {
			await ogOptions.hydrate?.(dehydrated);
			const { dehydratedI18n } = dehydrated as { dehydratedI18n?: DehydratedI18n };
			if (dehydratedI18n) i18n.loadAndActivate(dehydratedI18n);
		};
	}

	return router;
}
