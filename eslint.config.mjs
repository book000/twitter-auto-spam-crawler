import baseConfig from '@book000/eslint-config'

export default [
  ...baseConfig,
  {
    files: ['src/__tests__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-empty-function': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-floating-promises': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      'import/no-duplicates': 'off',
      camelcase: ['error', { allow: ['^GM_'] }],
      'unicorn/no-useless-undefined': 'off',
    },
  },
  {
    files: ['src/__mocks__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
    },
  },
]
