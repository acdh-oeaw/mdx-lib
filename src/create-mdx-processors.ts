import {
	type CompileOptions,
	createFormatAwareProcessors,
	type FormatAwareProcessors,
} from "@mdx-js/mdx/internal-create-format-aware-processors";

import type { Locale } from "./config";

type MaybePromise<T> = T | Promise<T>;

const cache = new Map<Locale, FormatAwareProcessors>();

export function createMdxProcessors<TLocale extends Locale>(
	createMdxConfig: (
		locale: TLocale,
	) => MaybePromise<Omit<CompileOptions, "format" | "outputFormat" | "providerImportSource">>,
) {
	return async function createMdxProcessor(locale: TLocale) {
		if (cache.has(locale)) return cache.get(locale)!;

		const config = await createMdxConfig(locale);
		const processor = createFormatAwareProcessors({
			...config,
			format: "mdx",
			outputFormat: "function-body",
			providerImportSource: "#",
		});

		cache.set(locale, processor);

		return processor;
	};
}
