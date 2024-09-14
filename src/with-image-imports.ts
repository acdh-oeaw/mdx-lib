import { join } from "node:path/posix";

import { assert } from "@acdh-oeaw/lib";
import type { ImportDeclaration } from "estree";
import type { Root } from "hast";
import type { MdxJsxAttribute, MdxJsxTextElementHast } from "mdast-util-mdx-jsx";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

export interface WithImageImportsOptions {
	/** @default ["Figure"] */
	components?: Array<string>;
	/** @default "/public/" */
	publicPath?: `/${string}/`;
}

export const withImageImports: Plugin<[WithImageImportsOptions], Root> = function withImageImports(
	options = {},
) {
	const { components = ["Figure"], publicPath = "/public/" } = options;

	return function transformer(tree) {
		function getImagePath(src: unknown): string | null {
			if (typeof src !== "string") return null;
			if (src.startsWith("/")) return join(publicPath, src);
			if (src.startsWith("./")) return src;
			if (src.startsWith("../")) return src;
			return null;
		}

		const imports = new Map<string, string>();

		function getName(path: string): string {
			if (!imports.has(path)) {
				imports.set(path, `__image${String(imports.size)}__`);
			}

			return imports.get(path)!;
		}

		visit(tree, (node, index, parent) => {
			if (parent == null) return;
			if (index == null) return;

			if (node.type === "element" && node.tagName === "img") {
				const path = getImagePath(node.properties["src"]);
				if (path == null) return;

				const name = getName(path);

				const attributes: Array<MdxJsxAttribute> = [];

				attributes.push({
					type: "mdxJsxAttribute",
					name: "src",
					value: {
						type: "mdxJsxAttributeValueExpression",
						value: name,
						data: {
							estree: {
								type: "Program",
								sourceType: "module",
								body: [{ type: "ExpressionStatement", expression: { type: "Identifier", name } }],
							},
						},
					},
				});

				const alt = node.properties["alt"];
				if (typeof alt === "string") {
					attributes.push({ type: "mdxJsxAttribute", name: "alt", value: alt });
				}

				const title = node.properties["title"];
				if (typeof title === "string") {
					attributes.push({ type: "mdxJsxAttribute", name: "title", value: title });
				}

				const img: MdxJsxTextElementHast = {
					type: "mdxJsxTextElement",
					name: "img",
					children: [],
					attributes,
				};

				parent.children.splice(index, 1, img);
			} else if (
				node.type === "mdxJsxFlowElement" &&
				node.name != null &&
				components.includes(node.name)
			) {
				const attribute = node.attributes.find((attribute) => {
					return attribute.type === "mdxJsxAttribute" && attribute.name === "src";
				});
				const path = getImagePath(attribute?.value);
				if (path == null) return;

				const name = getName(path);

				assert(attribute);

				attribute.value = {
					type: "mdxJsxAttributeValueExpression",
					value: name,
					data: {
						estree: {
							type: "Program",
							sourceType: "module",
							body: [{ type: "ExpressionStatement", expression: { type: "Identifier", name } }],
						},
					},
				};
			}
		});

		if (imports.size > 0) {
			const declarations: Array<ImportDeclaration> = [];

			imports.forEach((name, path) => {
				declarations.push({
					type: "ImportDeclaration",
					specifiers: [{ type: "ImportDefaultSpecifier", local: { type: "Identifier", name } }],
					source: { type: "Literal", value: path },
				});
			});

			tree.children.unshift({
				type: "mdxjsEsm",
				value: "",
				data: { estree: { type: "Program", sourceType: "module", body: declarations } },
			});
		}
	};
};
