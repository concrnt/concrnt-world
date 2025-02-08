import globals from "globals";
import react from "eslint-plugin-react";

export default [
    {
        plugins: {
            react,
        },
        languageOptions: {
            globals: {
                ...globals.browser,
            },

            ecmaVersion: "latest",
            sourceType: "module",

            parserOptions: {
                project: ["tsconfig.json"],
            },

        },

        rules: {
            "@typescript-eslint/no-dynamic-delete": ["off"],
            "@typescript-eslint/no-floating-promises": ["off"],
            "@typescript-eslint/no-misused-promises": ["off"],
            "@typescript-eslint/no-non-null-assertion": ["off"],
            "@typescript-eslint/prefer-nullish-coalescing": ["off"],
            "@typescript-eslint/promise-function-async": ["off"],
            "@typescript-eslint/restrict-plus-operands": ["off"],
            "@typescript-eslint/restrict-template-expressions": ["off"],
            "@typescript-eslint/strict-boolean-expressions": ["off"],
            "@typescript-eslint/triple-slash-reference": ["off"],
            "@typescript-eslint/consistent-type-assertions": ["off"],
            "react/react-in-jsx-scope": ["off"],
        },
    },
];
