import { isNonEmptyString } from "@acdh-oeaw/lib";
import { valueToEstree } from "estree-util-value-to-estree";
import type { Root } from "hast";
import { headingRank as rank } from "hast-util-heading-rank";
import { toString } from "hast-util-to-string";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

interface Heading {
	value: string;
	depth: number;
	id?: string;
}

interface TableOfContentsEntry extends Heading {
	children?: Array<TableOfContentsEntry>;
}

export type TableOfContents = Array<TableOfContentsEntry>;

declare module "vfile" {
	interface DataMap {
		tableOfContents: TableOfContents;
	}
}

export interface WithTableOfContentsOptions {
	/** @default "TableOfContents" */
	component?: string;
	/** @default "tableOfContents" */
	identifier?: string;
}

export const withTableOfContents: Plugin<[WithTableOfContentsOptions], Root> =
	function withTableOfContents(options = {}) {
		const { component = "TableOfContents", identifier = "tableOfContents" } = options;

		return function transformer(tree, vfile) {
			const headings: Array<Heading> = [];

			visit(tree, "element", (element) => {
				const level = rank(element);

				if (level != null) {
					const heading: Heading = {
						depth: level,
						value: toString(element),
					};

					if (isNonEmptyString(element.properties["id"])) {
						heading.id = element.properties["id"];
					}

					headings.push(heading);
				}
			});

			vfile.data.tableOfContents = createTree(headings)!;

			function createTree(headings: Array<Heading>) {
				const root: TableOfContentsEntry = { depth: 0, children: [], value: "" };
				const parents: Array<TableOfContentsEntry> = [];
				let previous: TableOfContentsEntry = root;

				headings.forEach((heading) => {
					if (heading.depth > previous.depth) {
						previous.children ??= [];
						parents.push(previous);
					} else if (heading.depth < previous.depth) {
						while (parents.at(-1)!.depth >= heading.depth) {
							parents.pop();
						}
					}

					const parent = parents.at(-1)!;

					parent.children!.push(heading);
					previous = heading;
				});

				return root.children;
			}

			tree.children.unshift({
				type: "mdxjsEsm",
				value: `export const ${identifier} = ${JSON.stringify(vfile.data.tableOfContents)};`,
				data: {
					estree: {
						type: "Program",
						sourceType: "module",
						body: [
							{
								type: "ExportNamedDeclaration",
								source: null,
								specifiers: [],
								declaration: {
									type: "VariableDeclaration",
									kind: "const",
									declarations: [
										{
											type: "VariableDeclarator",
											id: { type: "Identifier", name: identifier },
											init: valueToEstree(vfile.data.tableOfContents),
										},
									],
								},
							},
						],
					},
				},
			});

			visit(tree, "mdxJsxFlowElement", (node) => {
				if (node.name !== component) return;

				node.attributes.push({
					type: "mdxJsxAttribute",
					name: "tableOfContents",
					value: {
						type: "mdxJsxAttributeValueExpression",
						value: "tableOfContents",
						data: {
							estree: {
								type: "Program",
								sourceType: "module",
								body: [
									{
										type: "ExpressionStatement",
										expression: {
											type: "Identifier",
											name: identifier,
										},
									},
								],
							},
						},
					},
				});
			});
		};
	};
