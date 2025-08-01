import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Disable problematic rules that cause build failures
      "react-hooks/exhaustive-deps": "warn",
      "@next/next/no-img-element": "warn",
      // Allow these during production builds
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
];

export default eslintConfig;
