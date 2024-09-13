/**
 * Provide supported locales by augmenting the interface:
 *
 * ```ts
 * export interface MdxConfig {
 *   locales: "de" | "en"
 * }
 * ```
 */
export interface MdxConfig {}

export type Locale = MdxConfig extends { locales: string } ? MdxConfig["locales"] : string;

export const typographyConfig = {
	de: {
		openingQuotes: { double: "„", single: "‚" },
		closingQuotes: { double: "“", single: "‘" },
	},
	en: {
		openingQuotes: { double: "“", single: "‘" },
		closingQuotes: { double: "”", single: "’" },
	},
};
