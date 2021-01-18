module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  extends: [
    'airbnb-base',
  ],
  plugins: [
  ],
  // add your custom rules here
  rules: {
    'max-len': ['error', { code: 120 }],
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'object-curly-newline': ['error', { minProperties: 6, multiline: true }],
  },
};
