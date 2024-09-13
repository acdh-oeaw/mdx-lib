export { type MdxConfig, typographyConfig } from "./config";
export { createMdxProcessors } from "./create-mdx-processors";
export { withCustomHeadingIds, type WithCustomHeadingIdsOptions } from "./with-custom-heading-ids";
export { withFootnotes, type WithFootnotesOptions } from "./with-footnotes";
export { withIframeTitles, type WithIframeTitlesOptions } from "./with-iframe-titles";
export { withImageImports, type WithImageImportsOptions } from "./with-image-imports";
export {
	type TableOfContents,
	withTableOfContents,
	type WithTableOfContentsOptions,
} from "./with-table-of-contents";
export { run } from "@mdx-js/mdx";
