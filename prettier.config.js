import shopifyConfig from "@shopify/prettier-config" with {type: "json"};

/** @type {import('prettier').Config} */
export default {
    ...shopifyConfig,
    tabWidth: 4,
    arrowParens: "avoid",
    printWidth: 120,
    trailingComma: "none",
    singleQuote: false
};
