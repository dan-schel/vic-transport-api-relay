import eslint from "@eslint/js";
import prettier from "eslint-plugin-prettier/recommended";
import tseslint from "typescript-eslint";

// Philosophy: Reserve errors for situations where the code will not run or
// compile. Everything else is a warning. Warnings will still cause CI to fail,
// but let the dev get away with trying something temporarily without the editor
// putting red squigglies all over the place.

const customRules = {
  rules: {
    // Ignore unused variables if they start with underscores.
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],

    // Require === and !==, except when comparing to null.
    eqeqeq: ["warn", "always", { null: "ignore" }],

    // Warn on console.log uses, but allow console.warn.
    "no-console": ["warn", { allow: ["warn", "error"] }],

    // Warn about prettier violations.
    "prettier/prettier": "warn",
  },
};

export default tseslint.config(
  {
    ignores: ["node_modules/*", "data/*", ".temp*/*"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  prettier,
  customRules,
);
