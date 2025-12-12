import base from "@acdh-oeaw/eslint-config";
import node from "@acdh-oeaw/eslint-config-node";
import { defineConfig } from "eslint/config";
import gitignore from "eslint-config-flat-gitignore";

const config = defineConfig(gitignore(), base, node);

export default config;
