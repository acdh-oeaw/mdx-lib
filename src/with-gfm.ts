import type { Root } from "mdast";
import { gfmFootnoteFromMarkdown, gfmFootnoteToMarkdown } from "mdast-util-gfm-footnote";
import {
	gfmStrikethroughFromMarkdown,
	gfmStrikethroughToMarkdown,
} from "mdast-util-gfm-strikethrough";
import { gfmTableFromMarkdown, gfmTableToMarkdown } from "mdast-util-gfm-table";
import {
	gfmTaskListItemFromMarkdown,
	gfmTaskListItemToMarkdown,
} from "mdast-util-gfm-task-list-item";
import { gfmFootnote } from "micromark-extension-gfm-footnote";
import { gfmStrikethrough } from "micromark-extension-gfm-strikethrough";
import { gfmTable } from "micromark-extension-gfm-table";
import { gfmTaskListItem } from "micromark-extension-gfm-task-list-item";
import type { Options } from "remark-gfm";
import type { Plugin, Processor } from "unified";

/**
 * Use github flavored markdown, but without autolink literals.
 */
export const withGfm: Plugin<[Options], Root> = function withGfm(options = {}) {
	// @ts-expect-error: It's fine.
	const self = this as Processor<Root>;
	const data = self.data();

	// @ts-expect-error: It's fine.
	data.micromarkExtensions ||= [];
	// @ts-expect-error: It's fine.
	data.fromMarkdownExtensions ||= [];
	// @ts-expect-error: It's fine.
	data.toMarkdownExtensions ||= [];

	// @ts-expect-error: It's fine.
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
	data.micromarkExtensions.push(
		gfmFootnote(),
		gfmStrikethrough(options),
		gfmTable(),
		gfmTaskListItem(),
	);
	// @ts-expect-error: It's fine.
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
	data.fromMarkdownExtensions.push(
		gfmFootnoteFromMarkdown(),
		gfmStrikethroughFromMarkdown(),
		gfmTableFromMarkdown(),
		gfmTaskListItemFromMarkdown(),
	);
	// @ts-expect-error: It's fine.
	// eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
	data.toMarkdownExtensions.push(
		gfmFootnoteToMarkdown(options),
		gfmStrikethroughToMarkdown(),
		gfmTableToMarkdown(options),
		gfmTaskListItemToMarkdown(),
	);
};
