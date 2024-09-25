import "mdast-util-mdx-jsx";

import { assert } from "@acdh-oeaw/lib";
import type { Root } from "hast";
import { heading as isHeadingElement } from "hast-util-heading";
import type { Plugin } from "unified";
import { SKIP, visit } from "unist-util-visit";

const regex = /\s*\[#([\s\S]+?)\]\s*$/;

export interface WithCustomHeadingIdsOptions {
	/** @default "HeadingId" */
	component?: string;
}

export const withCustomHeadingIds: Plugin<[WithCustomHeadingIdsOptions], Root> =
	function withCustomHeadingIds(options = {}) {
		const { component = "HeadingId" } = options;

		return function transformer(tree) {
			visit(tree, (node) => {
				if (!isHeadingElement(node)) return;
				if (node.properties["id"] != null) return;

				const lastChild = node.children.at(-1);
				if (lastChild == null || lastChild.type !== "text") return;

				const heading = lastChild.value;
				/**
				 * Supported format: `[#about]`.
				 */
				const match = regex.exec(heading);
				if (match == null) return;

				node.properties["id"] = match[1];

				lastChild.value = heading.slice(0, match.index);

				return SKIP;
			});

			visit(tree, "mdxJsxTextElement", (node, index, parent) => {
				if (parent == null) return undefined;
				if (index == null) return undefined;

				if (node.name !== component) return undefined;

				assert(
					isHeadingElement(parent),
					`\`<${component}>\` must be a direct child of a heading element.`,
				);

				const id = node.attributes.find((attribute) => {
					return attribute.type === "mdxJsxAttribute" && attribute.name === "id";
				})?.value;

				assert(id, `\`<${component}>\` has no \`id\` prop.`);

				if (parent.properties["id"] == null) {
					parent.properties["id"] = String(id);
				}

				parent.children.splice(index, 1);

				return SKIP;
			});
		};
	};
