import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default tseslint.config(
    // Base ESLint recommended rules
    eslint.configs.recommended,

    // TypeScript recommended rules
    ...tseslint.configs.recommended,

    // Prettier compatibility (disables conflicting rules)
    prettier,

    // Global ignores
    {
        ignores: [
            "dist/**",
            "node_modules/**",
            "web/**",
            "contracts/**",
            ".auto-claude/**",
            "*.config.js",
            "*.config.ts",
            "drizzle/**",
        ],
    },

    // TypeScript-specific rules
    {
        files: ["src/**/*.ts"],
        languageOptions: {
            parserOptions: {
                project: "./tsconfig.json",
            },
        },
        rules: {
            // Type safety
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/explicit-function-return-type": "off",
            "@typescript-eslint/consistent-type-imports": [
                "warn",
                { prefer: "type-imports", fixStyle: "inline-type-imports" },
            ],

            // Unused variables (allow underscore prefix)
            "@typescript-eslint/no-unused-vars": [
                "warn",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    caughtErrorsIgnorePattern: "^_",
                },
            ],

            // Code quality
            "no-console": ["warn", { allow: ["warn", "error"] }],
            "prefer-const": "error",
            "no-var": "error",
            eqeqeq: ["error", "always", { null: "ignore" }],

            // Allow empty catch blocks with comment
            "no-empty": ["error", { allowEmptyCatch: true }],

            // Async/await best practices
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/await-thenable": "error",
            "@typescript-eslint/require-await": "warn",

            // Prevent common mistakes
            "@typescript-eslint/no-misused-promises": [
                "error",
                { checksVoidReturn: false },
            ],
        },
    },

    // Test files - relaxed rules
    {
        files: ["**/*.test.ts", "**/*.spec.ts", "test/**/*.ts"],
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "no-console": "off",
        },
    },
);
