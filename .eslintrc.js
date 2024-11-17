module.exports = {
  root: true,
  env: {
    node: true,
    es2024: true,
  },
  plugins: [
    'prettier',
    'unicorn'
  ],
  extends: [
    'eslint:recommended',
    'plugin:unicorn/recommended',
    'plugin:prettier/recommended',
  ],
  parserOptions: {
    ecmaVersion: 2024,
    sourceType: 'module',
  },
  rules: {
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'prefer-const': 'error',
    'no-var': 'error',
    'curly': ['error', 'all'],
    'eqeqeq': ['error', 'always'],
    'max-lines': ['error', { 
      max: 300,
      skipBlankLines: true,
      skipComments: true,
    }],
    'complexity': ['error', 10],
  },
  ignorePatterns: [
    'dist',
    'coverage',
    'node_modules',
    '*.js',
  ],
};