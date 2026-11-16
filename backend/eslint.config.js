const js = require('@eslint/js')
const globals = require('globals')

module.exports = [
  js.configs.recommended,
  { languageOptions: { sourceType: 'commonjs', globals: { ...globals.node, ...globals.jest } } },
  // Scripts mongosh (exécutés dans le shell MongoDB, pas dans Node) : globales du shell.
  {
    files: ['sql/**/*.js', 'migration/**/*.js'],
    languageOptions: { sourceType: 'script', globals: { db: 'readonly', print: 'readonly', ObjectId: 'readonly' } },
  },
]
