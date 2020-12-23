module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  rules: {
    'no-empty': ['error', { allowEmptyCatch: true }],
    '@typescript-eslint/no-use-before-define': ['error', { functions: false }],
  },
};
