import "mdast-util-mdx-jsx";

import type { Root } from "hast";
import { toString } from "hast-util-to-string";
import type { Plugin } from "unified";
import { SKIP, visit } from "unist-util-visit";

export interface WithIframeTitlesOptions {
	/** @default ["Embed", "Video"] */
	components?: Array<string>;
}

export const withIframeTitles: Plugin<[WithIframeTitlesOptions], Root> = function withIframeTitles(
	options = {},
) {
	const { components = ["Embed", "Video"] } = options;

	return function transformer(tree) {
		visit(tree, "mdxJsxFlowElement", (node) => {
			if (node.name == null) return undefined;

			if (!components.includes(node.name)) return undefined;

			const title = node.attributes.find(
				(attribute) => attribute.type === "mdxJsxAttribute" && attribute.name === "title",
			);

			if (title != null) return undefined;

			node.attributes.push({
				type: "mdxJsxAttribute",
				name: "title",
				value: toString(node),
			});

			return SKIP;
		});
	};
};
