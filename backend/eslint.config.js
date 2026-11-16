const js = require('@eslint/js')
const globals = require('globals')
const tseslint = require('typescript-eslint')
const { defineConfig, globalIgnores } = require('eslint/config')

module.exports = defineConfig([
  globalIgnores(['dist', 'coverage']),

  // Code TypeScript de l'API et des tests
  {
    files: ['**/*.ts'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { globals: { ...globals.node, ...globals.jest } },
  },

  // Ce fichier de configuration lui-même (CommonJS)
  {
    files: ['eslint.config.js'],
    extends: [js.configs.recommended],
    languageOptions: { sourceType: 'commonjs', globals: globals.node },
  },

  // Scripts mongosh (exécutés dans le shell MongoDB, pas dans Node) : restent en JavaScript.
  {
    files: ['sql/**/*.js', 'migration/**/*.js'],
    extends: [js.configs.recommended],
    languageOptions: { sourceType: 'script', globals: { db: 'readonly', print: 'readonly', ObjectId: 'readonly' } },
  },
])
