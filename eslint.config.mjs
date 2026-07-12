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
      // テストでは globalThis / window にモック用プロパティを直接代入する場面が多いため無効化
      'unicorn/no-global-object-property-assignment': 'off',
      // `setXxxSpy` のような jest.spyOn 変数名は慣習的な命名のため対象外
      'unicorn/no-non-function-verb-prefix': 'off',
    },
  },
  {
    files: ['src/__mocks__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      // モックではユーザースクリプトのグローバル API (GM_*) を直接定義する必要がある
      'unicorn/no-global-object-property-assignment': 'off',
    },
  },
]
