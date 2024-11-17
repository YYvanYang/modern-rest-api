module.exports = {
  semi: true,
  trailingComma: 'all',
  singleQuote: true,
  printWidth: 80,
  tabWidth: 2,
  endOfLine: 'lf',
  arrowParens: 'avoid',
  bracketSpacing: true,
  useTabs: false,
  quoteProps: 'as-needed',
  bracketSameLine: false,
  proseWrap: 'preserve',
  overrides: [
    {
      files: '*.{json,yml,yaml,md}',
      options: {
        tabWidth: 2,
      },
    },
  ],
};