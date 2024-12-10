import type { Root } from "hast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

export interface WithUnwrappedMdxFlowContentOptions {
	/** @default ["LinkButton"] */
	components?: Array<string>;
}

/**
 * Wrap mdx flow element content in `<span>`, instead of `<p>`.
 */
export const withUnwrappedMdxFlowContent: Plugin<[WithUnwrappedMdxFlowContentOptions], Root> =
	function withUnwrappedMdxFlowContent(options = {}) {
		const { components = ["LinkButton"] } = options;

		return function transformer(tree) {
			visit(tree, "mdxJsxFlowElement", (node) => {
				if (node.name == null || !components.includes(node.name)) return;

				node.children = node.children.map((child) => {
					if (child.type !== "element" || child.tagName !== "p") return child;

					return {
						type: "mdxJsxTextElement",
						name: "span",
						attributes: [],
						children: child.children,
					};
				});
			});
		};
	};
