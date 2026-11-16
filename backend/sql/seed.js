// =============================================================================================
//  HelpUP — création de la base VIDE (collections, règles de validation, index)
//  Script mongosh autonome : aucune dépendance, exécutable directement sur Atlas.
//
//  Lancer :
//    - Compass connecté à Atlas → onglet « MONGOSH » → coller tout le fichier → Entrée
//    - ou en ligne de commande : mongosh "<MONGODB_URI>" backend/sql/seed.js
//
//  Sans danger : ne supprime aucune donnée, peut être relancé (met à jour validation et index).
//  Les listes ci-dessous doivent rester identiques à backend/src/constants/ et à migration/seed-demo.js.
// =============================================================================================
{
  const DB_NAME = 'helpup'
  const database = db.getSiblingDB(DB_NAME)

  const CATEGORIES = ['bricolage', 'informatique', 'soutien-scolaire', 'courses', 'demenagement', 'animaux', 'jardinage', 'garde-enfants']
  const QUARTIERS = ['paris-13-butte-aux-cailles', 'paris-13-place-d-italie', 'paris-13-bibliotheque', 'paris-14-denfert',
    'paris-14-alesia', 'paris-15-convention', 'paris-15-beaugrenelle', 'kremlin-bicetre', 'ivry-centre', 'villejuif-centre',
    'villejuif-paul-vaillant-couturier']
  const MISSION_STATUSES = ['open', 'assigned', 'completed', 'cancelled']
  const APPLICATION_STATUSES = ['pending', 'accepted', 'rejected', 'withdrawn']

  const str = (min, max, extra = {}) => ({ bsonType: 'string', minLength: min, maxLength: max, ...extra })
  const num = (min, max) => ({ bsonType: ['int', 'long', 'double'], minimum: min, maximum: max })
  const id = { bsonType: 'objectId' }
  const date = { bsonType: 'date' }

  const COLLECTIONS = {
    users: {
      schema: {
        required: ['email', 'passwordHash', 'firstName', 'lastName'],
        properties: {
          email: str(3, 254, { pattern: '^[^A-Z@\\s]+@[^A-Z@\\s]+\\.[^A-Z@\\s]+$', description: 'email en minuscules' }),
          passwordHash: str(50, 100, { description: 'hash bcrypt, jamais le mot de passe en clair' }),
          firstName: str(1, 50),
          lastName: str(1, 50),
          phone: str(10, 10, { pattern: '^0[1-9][0-9]{8}$' }),
          city: str(0, 80),
          bio: str(0, 500),
          skills: { bsonType: 'array', maxItems: 8, uniqueItems: true, items: { enum: CATEGORIES } },
          avatarUrl: str(9, 500, { pattern: '^https://' }),
          createdAt: date,
          updatedAt: date,
        },
      },
      indexes: [{ key: { email: 1 }, name: 'email_unique', unique: true }],
    },

    missions: {
      schema: {
        required: ['ownerId', 'title', 'description', 'rewardCents', 'estimatedMinutes', 'category', 'scheduledAt',
          'quartier', 'location', 'status'],
        properties: {
          ownerId: id,
          providerId: { bsonType: ['objectId', 'null'] },
          title: str(5, 80),
          description: str(10, 1000),
          rewardCents: num(500, 50000),
          estimatedMinutes: num(15, 480),
          category: { enum: CATEGORIES },
          scheduledAt: date,
          quartier: { enum: QUARTIERS },
          location: {
            bsonType: 'object',
            required: ['type', 'coordinates'],
            properties: {
              type: { enum: ['Point'] },
              coordinates: { bsonType: 'array', minItems: 2, maxItems: 2, items: { bsonType: ['double', 'int'] } },
            },
          },
          status: { enum: MISSION_STATUSES },
          urgent: { bsonType: 'bool' },
          completedAt: { bsonType: ['date', 'null'] },
          createdAt: date,
          updatedAt: date,
        },
      },
      indexes: [
        { key: { location: '2dsphere' }, name: 'location_2dsphere' },
        { key: { title: 'text', description: 'text' }, name: 'text_search', default_language: 'french', weights: { title: 3, description: 1 } },
        { key: { status: 1, category: 1, rewardCents: 1 }, name: 'catalogue_filters' },
        { key: { ownerId: 1, createdAt: -1 }, name: 'owner_recent' },
        { key: { providerId: 1, status: 1 }, name: 'provider_status' },
      ],
    },

    applications: {
      schema: {
        required: ['missionId', 'applicantId', 'message', 'status'],
        properties: {
          missionId: id,
          applicantId: id,
          message: str(10, 500),
          status: { enum: APPLICATION_STATUSES },
          createdAt: date,
          updatedAt: date,
        },
      },
      indexes: [
        { key: { missionId: 1, applicantId: 1 }, name: 'one_application_per_mission', unique: true },
        { key: { applicantId: 1, createdAt: -1 }, name: 'applicant_recent' },
        { key: { missionId: 1, status: 1 }, name: 'mission_status' },
      ],
    },

    reviews: {
      schema: {
        required: ['missionId', 'authorId', 'targetId', 'rating'],
        properties: {
          missionId: id,
          authorId: id,
          targetId: id,
          rating: num(1, 5),
          comment: str(0, 500),
          createdAt: date,
          updatedAt: date,
        },
      },
      indexes: [
        { key: { missionId: 1, authorId: 1 }, name: 'one_review_per_mission', unique: true },
        { key: { targetId: 1 }, name: 'target' },
      ],
    },
  }

  print(`Base « ${DB_NAME} » — création de la structure`)
  const existing = database.getCollectionNames()

  for (const [name, { schema, indexes }] of Object.entries(COLLECTIONS)) {
    const options = { validator: { $jsonSchema: { bsonType: 'object', ...schema } }, validationLevel: 'moderate', validationAction: 'error' }

    if (!existing.includes(name)) {
      database.createCollection(name, options)
      print(`  ✓ ${name} : collection créée avec ses règles de validation`)
    } else {
      try {
        database.runCommand({ collMod: name, ...options })
        print(`  ✓ ${name} : existait déjà, règles de validation mises à jour`)
      } catch (err) {
        // Un compte Atlas limité à readWrite n'a pas le droit collMod : on garde les règles existantes.
        print(`  ! ${name} : existait déjà, règles non modifiées (${err.codeName || err.message})`)
      }
    }
    indexes.forEach(({ key, ...opts }) => database.getCollection(name).createIndex(key, opts))
    print(`    index : ${indexes.map((i) => i.name).join(', ')}`)
  }

  print('Structure prête (base vide).')
}
