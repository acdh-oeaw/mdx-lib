import { run, type RunOptions } from "@mdx-js/mdx";
import type { FormatAwareProcessors } from "@mdx-js/mdx/internal-create-format-aware-processors";

import type { Locale } from "./config";

export function createMdxCompiler<TLocale extends Locale>(
	createProcessor: (locale: TLocale) => Promise<FormatAwareProcessors>,
	runtime: Pick<RunOptions, "Fragment" | "jsx" | "jsxDEV" | "jsxs">,
	useMDXComponents: RunOptions["useMDXComponents"],
) {
	return async function compileMdx(content: string, baseUrl: URL, locale: TLocale) {
		const processor = await createProcessor(locale);
		const vfile = await processor.process({ path: baseUrl, value: content });
		return run(vfile, { ...runtime, baseUrl, useMDXComponents });
	};
}
