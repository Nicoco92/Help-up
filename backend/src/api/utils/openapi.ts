import fs from 'node:fs'
import path from 'node:path'
import YAML from 'yaml'

// Assemble le contrat OpenAPI découpé en plusieurs fichiers (dossier src/api/openapi/)
// en un seul document, servi par Swagger UI.
//
// Convention (voir src/api/openapi/README.md) :
// - une référence vers un autre fichier (`./paths/users.yaml#/me`) est remplacée par son contenu ;
// - une référence vers le fichier racine (`../openapi.yaml#/components/schemas/User`) devient
//   une référence locale (`#/components/schemas/User`) : les composants gardent leur nom dans Swagger ;
// - dans un fichier autre que la racine, une référence locale `#/...` est refusée, car ambiguë.

type Node = unknown

function decodeSegment(segment: string): string {
  return decodeURIComponent(segment).replace(/~1/g, '/').replace(/~0/g, '~')
}

function followPointer(doc: Node, fragment: string, where: string): Node {
  if (fragment === '' || fragment === '/') return doc
  return fragment
    .split('/')
    .slice(1)
    .map(decodeSegment)
    .reduce<Node>((node, key) => {
      if (node === null || typeof node !== 'object' || !(key in node)) {
        throw new Error(`OpenAPI : référence introuvable ${where}`)
      }
      return (node as Record<string, Node>)[key]
    }, doc)
}

export function loadOpenApi(rootFile: string): Record<string, unknown> {
  const root = path.resolve(rootFile)
  const cache = new Map<string, Node>()

  const read = (file: string): Node => {
    if (!cache.has(file)) {
      cache.set(file, YAML.parse(fs.readFileSync(file, 'utf8')))
    }
    return cache.get(file)
  }

  const resolve = (node: Node, file: string, stack: string[]): Node => {
    if (Array.isArray(node)) return node.map((item) => resolve(item, file, stack))
    if (node === null || typeof node !== 'object') return node

    const obj = node as Record<string, Node>
    if (typeof obj.$ref === 'string') {
      const ref = obj.$ref
      if (ref.startsWith('#')) {
        if (file !== root) {
          throw new Error(
            `OpenAPI : « ${ref} » dans ${path.relative(path.dirname(root), file)} est ambigu, ` +
              'passer par le fichier racine (ex. ../openapi.yaml#/components/schemas/User)',
          )
        }
        return obj
      }

      const [filePart, fragment = ''] = ref.split('#')
      const target = path.resolve(path.dirname(file), filePart)
      if (target === root) return { $ref: `#${fragment}` }

      const key = `${target}#${fragment}`
      if (stack.includes(key)) throw new Error(`OpenAPI : référence circulaire ${ref}`)
      const where = `« ${ref} » (depuis ${path.relative(path.dirname(root), file)})`
      return resolve(followPointer(read(target), fragment, where), target, [...stack, key])
    }

    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, resolve(v, file, stack)]))
  }

  return resolve(read(root), root, []) as Record<string, unknown>
}
