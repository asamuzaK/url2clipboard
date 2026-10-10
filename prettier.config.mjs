export default {
  plugins: ['prettier-plugin-brace-style'],
  arrowParens: 'avoid',
  braceStyle: '1tbs',
  semi: true,
  singleQuote: true,
  trailingComma: 'none',
  overrides: [
    {
      files: ['*.md', '*.mdx'],
      options: {}
    }
  ]
};
