module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    "no-empty": ["error", { "allowEmptyCatch": true }],
    "@typescript-eslint/member-delimiter-style": ["error", {
      "multiline": {
          "delimiter": "comma",
          "requireLast": false
      },
      "singleline": {
          "delimiter": "comma",
      },
      "overrides": {
          "interface": {
              "multiline": {
                  "delimiter": "semi",
                  "requireLast": true
              }
          }
      }
    }],
    "@typescript-eslint/no-use-before-define": ["error", { "functions": false }]
  }
};
