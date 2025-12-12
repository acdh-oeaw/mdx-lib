import "mdast-util-mdx-jsx";

import type { FootnoteDefinition, FootnoteReference, Root } from "mdast";
import type { Plugin } from "unified";
import { SKIP, visit } from "unist-util-visit";

export interface WithFootnotesOptions {
	/** @default "Footnote" */
	component?: string;
}

export const withFootnotes: Plugin<[WithFootnotesOptions], Root> = function withFootnotes(
	options = {},
) {
	const { component = "Footnote" } = options;

	return function transformer(tree) {
		let count = 1;

		visit(tree, "mdxJsxTextElement", (node, index, parent) => {
			if (parent == null) {
				return undefined;
			}
			if (index == null) {
				return undefined;
			}

			if (node.name !== component) {
				return undefined;
			}

			/** Add prefix to avoid collisions with gfm footnotes in source mdx. */
			const id = `fn-${String(count)}`;

			const reference: FootnoteReference = {
				type: "footnoteReference",
				identifier: id,
				label: id,
			};

			const definition: FootnoteDefinition = {
				type: "footnoteDefinition",
				identifier: id,
				label: id,
				/** `<Footnote>` has phrasing/inline content as children, so we wrap them in a paragraph. */
				children: [
					{
						type: "paragraph",
						children: node.children,
					},
				],
			};

			parent.children.splice(index, 1, reference);

			tree.children.push(definition);

			count++;

			return SKIP;
		});
	};
};
