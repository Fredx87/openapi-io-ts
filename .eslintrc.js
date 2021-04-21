module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "fp-ts", "prettier"],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: ["./packages/*/tsconfig.json", "./examples/*/tsconfig.json"],
  },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:fp-ts/all",
    "plugin:prettier/recommended",
  ],
  rules: {
    "fp-ts/no-module-imports": "off",
  },
};
