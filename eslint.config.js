const editorconfig = require("eslint-plugin-editorconfig");
const importPlugin = require("eslint-plugin-import");
const n = require("eslint-plugin-n");

module.exports = [
    {
        files: ["**/*.js"],
        plugins: {
            editorconfig,
            import: importPlugin,
            n,
        },
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "commonjs",
            globals: {
                require: "readonly",
                module: "readonly",
                exports: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
                process: "readonly",
                console: "readonly",
                Buffer: "readonly",
                setTimeout: "readonly",
                setInterval: "readonly",
                clearTimeout: "readonly",
                clearInterval: "readonly",
            },
        },
        rules: {
            "editorconfig/indent": ["error"],
            "no-console": "off",
            "import/no-unresolved": "error",
            "n/no-missing-require": "error",
            "no-labels": "off",
            "no-self-compare": "off",
            "no-sequences": "off",
            "no-return-assign": "off",
            "no-tabs": ["error", { allowIndentationTabs: true }],
            "camelcase": "off",
            "no-unused-vars": "off",
            "no-reserved-keys": "off",
            "n/handle-callback-err": "off",
            "new-cap": "off",
            "space-before-function-paren": "off",
            "spaced-comment": ["error", "always"],
            "eqeqeq": "off",
            "eol-last": ["error", "always"],
            "quote-props": ["error", "consistent-as-needed"],
            "indent": ["error", 4],
            "quotes": ["error", "double"],
            "semi": ["error", "always"],
            "semi-style": ["error", "last"],
            "no-inner-declarations": "off",
        },
        settings: {
            "import/resolver": {
                node: {
                    extensions: [".js"],
                },
            },
        },
    },
    {
        ignores: ["node_modules/**"],
    },
];
