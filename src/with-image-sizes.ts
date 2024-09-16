import { join } from "node:path";

import { assert } from "@acdh-oeaw/lib";
import type { Root } from "hast";
import { imageSize } from "image-size";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

const defaultPublicPath = join(process.cwd(), "public");

export interface WithImageSizesOptions {
	/** @default ["Figure"] */
	components?: Array<string>;
	/** @default "<rootDir>/public/" */
	publicPath?: string;
}

export const withImageSizes: Plugin<[WithImageSizesOptions], Root> = function withImageSizes(
	options = {},
) {
	const { components = ["Figure"], publicPath = defaultPublicPath } = options;

	return function transformer(tree, vfile) {
		function getImagePath(src: unknown): string | null {
			if (typeof src !== "string") return null;

			if (src.startsWith("/")) {
				return join(publicPath, src);
			}

			if (src.startsWith("./") || src.startsWith("../")) {
				const basePath = vfile.dirname;
				assert(basePath);

				return join(basePath, src);
			}

			return null;
		}

		visit(tree, (node, index, parent) => {
			if (parent == null) return;
			if (index == null) return;

			if (node.type === "element" && node.tagName === "img") {
				if (node.properties["height"] != null || node.properties["width"] != null) return;

				const path = getImagePath(node.properties["src"]);
				if (path == null) return;

				const { height, width } = imageSize(path);
				if (height == null || width == null) return;

				node.properties["height"] = height;
				node.properties["width"] = width;
			} else if (
				node.type === "mdxJsxFlowElement" &&
				node.name != null &&
				components.includes(node.name)
			) {
				if (
					node.attributes.some((attribute) => {
						return (
							attribute.type === "mdxJsxAttribute" &&
							(attribute.name === "height" || attribute.name === "width") &&
							attribute.value != null
						);
					})
				) {
					return;
				}

				const attribute = node.attributes.find((attribute) => {
					return attribute.type === "mdxJsxAttribute" && attribute.name === "src";
				});
				const path = getImagePath(attribute?.value);
				if (path == null) return;

				const { height, width } = imageSize(path);
				if (height == null || width == null) return;

				node.attributes.push({
					type: "mdxJsxAttribute",
					name: "height",
					value: {
						type: "mdxJsxAttributeValueExpression",
						value: String(height),
						data: {
							estree: {
								type: "Program",
								body: [
									{
										type: "ExpressionStatement",
										expression: {
											type: "Literal",
											value: width,
											raw: String(width),
										},
									},
								],
								sourceType: "module",
							},
						},
					},
				});

				node.attributes.push({
					type: "mdxJsxAttribute",
					name: "width",
					value: {
						type: "mdxJsxAttributeValueExpression",
						value: String(width),
						data: {
							estree: {
								type: "Program",
								body: [
									{
										type: "ExpressionStatement",
										expression: {
											type: "Literal",
											value: width,
											raw: String(width),
										},
									},
								],
								sourceType: "module",
							},
						},
					},
				});
			}
		});
	};
};
