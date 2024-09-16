# mdx lib

utilities and plugins for [`mdx`](https://mdxjs.com).

## how to install

```bash
npm i @acdh-oeaw/mdx-lib
```

## how to use

configure types for supported locales and jsx:

```ts
// ./types/mdx.d.ts

// import type * as runtime from "astro/jsx-runtime";
import type * as runtime from "react/jsx-runtime";

declare module "mdx/types" {
	namespace JSX {
		type Element = runtime.JSX.Element;
		type ElementClass = runtime.JSX.ElementClass;
		type IntrinsicElements = runtime.JSX.IntrinsicElements;
	}
}

declare module "@acdh-ch/mdx-lib" {
	export interface MdxConfig {
		locales: "de" | "en";
	}
}
```

provide component mappings (in next.js the file location has to be `mdx-components.tsx` at the
project root):

```ts
// ./mdx-components.ts

import { Link } from "@/components/link";

const components = {
	a: Link,
	/** ... */
};

declare global {
	type MDXProvidedComponents = typeof components;
}

export function useMDXComponents(): MDXProvidedComponents {
	return components;
}
```

create locale aware mdx compilers:

```ts
// ./lib/mdx/compile-mdx.ts

import { createMdxProcessors, run } from "@acdh-ch/mdx-lib";
// import * as runtime from "astro/jsx-runtime";
import * as runtime from "react/jsx-runtime";

const createProcessor = createMdxProcessors((locale) => {
	return {
		/** When using `astro` instead of `react`. */
		// elementAttributeNameCase: "html",
		// jsxImportSource: "astro",

		remarkPlugins: [],
		remarkRehypeOptions: {},
		rehypePlugins: [],
	};
});

export async function compileMdx(content: string, baseUrl: URL, locale: string) {
	const processor = await createProcessor(locale);
	const compiled = await processor.process(content);
	return run(compiled, { ...runtime, baseUrl, useMDXComponents });
}
```

note that in `astro` projects, you need to use the astro jsx runtime (`astro/jsx-runtime`), and set
`elementAttributeNameCase` to "html".

## plugins

### `with-custom-heading-ids`

`rehype` plugin which finds `<HeadingId id="abc" />` mdx components, and applies the `id` attribute
to a parent heading element.

example:

```mdx
## This is a heading <HeadingId id="my-custom-heading" />
```

when not using any other plugins, this would be transformed to a regular `<h2>` element. when using
the `rehype-slug` plugin, this would add an auto-generated id attribute:
`<h2 id="this-is-a-heading">`. when using this plugin, you can add custom ids to the heading:
`<h2 id="my-custom-heading">`. the `<HeadingId>` component will be removed from the generated
output.

### `with-footnotes`

`remark` plugin which finds inline `<Footnote>` mdx components, and transforms them to markdown
footnotes, i.e. `footnoteReference` and `footnoteDefinition` mdast nodes (requires `remark-gfm`).

example:

```mdx
This is an important sentence.<Footnote>Found it on the internet.</Footnote>
```

will be transformed to:

```html
<p>
	This is an important sentence.<sup
		><a
			href="#user-content-fn-1"
			id="user-content-fnref-1"
			data-footnote-ref
			aria-describedby="footnote-label"
			>1</a
		></sup
	>.
</p>
<section data-footnotes class="footnotes">
	<h2 class="sr-only" id="footnote-label">Footnotes</h2>
	<ol>
		<li id="user-content-fn-1">
			<p>
				Found it on the internet.
				<a
					href="#user-content-fnref-1"
					data-footnote-backref=""
					aria-label="Back to reference 1"
					class="data-footnote-backref"
					>↩</a
				>
			</p>
		</li>
	</ol>
</section>
```

The `h2` text content and `aria-label`s for generated elements can be controlled by setting
`remarkRehypeOptions`.

### `with-iframe-titles`

`rehype` plugin which applies the text content of a component to its `title` attribute. this is
meant to be used with components which render an `<iframe>`. accepts a `components` option listing
the names of components to handle.

example:

```mdx
<Embed src="https://example.com/iframe">This is **the** title.</Embed>
```

will be transformed to:

```html
<iframe src="https://example.com/iframe" title="This is the title." />
```

### `with-image-imports`

`rehype` plugin which transforms the `src` attribute of `<img>` elements and configured mdx
components into esm imports, because most javascript frameworks provide image optimisation features
which integrate with a bundler and work via import statements.

example:

```mdx
<img src="./first-image.png" />

<Figure src="/second-image.png">This is the image caption.</Figure>
```

will be transformed to:

```mdx
import __image1__ from "./first-image.png";
import __image2__ from "/home/stefan/my-project/public/second-image.png";

<img src={__image1__} />

<Figure src={__image2__}>This is the image caption.</Figure>
```

note that paths starting with "/" will be expanded to absolute paths using the `publicPath` config
option (defaults to "/public/"). for relative paths starting with "./" or "../", you need to provide
a `baseUrl` to the mdx compiler.

also note that you need a bundler to handle the image imports, so this requires
`outputFormat: "program"`.

don't forget to map `img` elements to a custom component which can handle objects as `src` prop,
e.g.:

```ts
// ./mdx-components.ts

import Image from "next/image";

const components = {
	img: Image,
};

export function useMDXComponents() {
	return components;
}
```

### `with-table-of-contents`

`rehype` plugin which generates a table of contents, and provides it via
`vfile.data.tableOfContents`, as well as a `tableOfContents` named export. additionally, it provides
the table of contents data to any `TableOfContents` mdx component.

```ts
const vfile = await processor.process(content);
console.log(vfile.data.tableOfContents);
const { default: Content, tableOfContents } = await run(vfile, { ...runtime });
```

### example using all provided plugins

```ts
// ./lib/mdx/compile-mdx.ts

import {
	createMdxCompiler,
	createMdxProcessors,
	typographyConfig,
	withCustomHeadingIds,
	withFootnotes,
	withIframeTitles,
	// withImageImports,
	withImageSizes,
	withTableOfContents,
} from "@acdh-ch/mdx-lib";
import withHeadingIds from "rehype-slug";
import withGfm from "remark-gfm";
import withTypographicQuotes from "remark-smartypants";
import * as runtime from "react/jsx-runtime";

import { useMDXComponents } from "../../mdx-components";

const createProcessor = createMdxProcessors((locale) => {
	return {
		remarkPlugins: [withGfm, [withTypographicQuotes, typographyConfig[locale]], withFootnotes],
		remarkRehypeOptions: {
			footnoteBackLabel(referenceIndex, rereferenceIndex) {
				return t("footnoteBackLabel", {
					reference: referenceIndex + 1 + (rereferenceIndex > 1 ? "-" + rereferenceIndex : ""),
				});
			},
			footnoteLabel: t("footnoteLabel"),
		},
		rehypePlugins: [
			withHeadingIds,
			withCustomHeadingIds,
			[withIframeTitles, { components: ["Embed", "Iframe", "Video"] }],
			// [withImageImports, { components: ["Figure"] }],
			[withImageSizes, { components: ["Figure"] }],
			withTableOfContents,
		],
	};
});

export const compileMdx = createMdxCompiler(createProcessor, runtime, useMDXComponents);
```
