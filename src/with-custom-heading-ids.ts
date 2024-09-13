import "mdast-util-mdx-jsx";

import { assert } from "@acdh-oeaw/lib";
import type { Root } from "hast";
import { heading as isHeadingElement } from "hast-util-heading";
import { SKIP, visit } from "unist-util-visit";

export interface WithCustomHeadingIdsOptions {
	/** @default "HeadingId" */
	component?: string;
}

export function withCustomHeadingIds(options: WithCustomHeadingIdsOptions = {}) {
	const { component = "HeadingId" } = options;

	return function transformer(tree: Root) {
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
}
