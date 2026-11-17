// =============================================================================================
//  HelpUP — création de la base + DONNÉES DE DÉMO (comptes, missions, candidatures, avis)
//  Script mongosh autonome : aucune dépendance, exécutable directement sur Atlas.
//
//  Lancer :
//    - Compass connecté à Atlas → onglet « MONGOSH » → coller tout le fichier → Entrée
//    - ou en ligne de commande : mongosh "<MONGODB_URI>" backend/migration/seed-demo.js
//
//  - Partie 1 : identique à sql/seed.js (collections, validation, index). Ne pas la modifier ici :
//    modifier sql/seed.js puis recopier son bloc.
//  - Partie 2 : données toujours identiques d'une exécution à l'autre (graine fixe).
//    Si la démo existe déjà, rien n'est inséré, sauf avec RESET = true (en haut de la partie 2) :
//    seuls les comptes @helpup.test et ce qui leur est lié sont alors supprimés et réinsérés.
// =============================================================================================

// =============================================================================================
//  1. Structure (copie de sql/seed.js)
// =============================================================================================
{
  const DB_NAME = 'helpup'
  const database = db.getSiblingDB(DB_NAME)

  // MongoDB refuse deux bases dont le nom ne diffère que par la casse (« helpup » et « HelpUP ») :
  // on s'arrête tout de suite avec un message clair plutôt que d'échouer au milieu du script.
  const conflict = db.adminCommand({ listDatabases: 1, nameOnly: true, authorizedDatabases: true }).databases
    .map((d) => d.name)
    .find((n) => n !== DB_NAME && n.toLowerCase() === DB_NAME.toLowerCase())
  if (conflict) {
    throw new Error(`La base « ${conflict} » existe déjà et bloque la création de « ${DB_NAME} » (même nom, casse différente). `
      + `Vérifiez avec l'équipe qu'elle ne contient rien d'important, supprimez-la, puis relancez.`)
  }

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
          role: { enum: ['client', 'admin'] },
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

// =============================================================================================
//  2. Données de démonstration
// =============================================================================================
{
  // Mettre à true pour supprimer la démo existante avant de la réinsérer.
  // Seuls les comptes en @helpup.test et ce qui leur est lié sont supprimés, jamais les vrais comptes.
  const RESET = false

  const database = db.getSiblingDB('helpup')
  const DEMO_DOMAIN = '@helpup.test'
  // Hash bcrypt (coût 10) du mot de passe de démo « password123 » : mongosh n'a pas bcrypt.
  const DEMO_PASSWORD_HASH = '$2b$10$Hs8ZAwiSiJ5y7wE/HgvZluHeH9V51iTOtOLI9kHwlUF5nfOJrXSje'
  const DAY = 24 * 60 * 60 * 1000
  const NOW = new Date()

  // Quartiers avec coordonnées [longitude, latitude] (identiques à backend/src/constants/quartiers.ts)
  const QUARTIERS = [
    { slug: 'paris-13-butte-aux-cailles', coordinates: [2.3500, 48.8270] },
    { slug: 'paris-13-place-d-italie', coordinates: [2.3555, 48.8310] },
    { slug: 'paris-13-bibliotheque', coordinates: [2.3770, 48.8300] },
    { slug: 'paris-14-denfert', coordinates: [2.3320, 48.8340] },
    { slug: 'paris-14-alesia', coordinates: [2.3270, 48.8280] },
    { slug: 'paris-15-convention', coordinates: [2.2960, 48.8370] },
    { slug: 'paris-15-beaugrenelle', coordinates: [2.2830, 48.8480] },
    { slug: 'kremlin-bicetre', coordinates: [2.3580, 48.8100] },
    { slug: 'ivry-centre', coordinates: [2.3870, 48.8130] },
    { slug: 'villejuif-centre', coordinates: [2.3640, 48.7875] },
    { slug: 'villejuif-paul-vaillant-couturier', coordinates: [2.3680, 48.7960] },
  ]
  const q = (slug) => QUARTIERS.find((x) => x.slug === slug)

  // --- Générateur pseudo-aléatoire à graine fixe : mêmes données à chaque exécution ---
  let seed = 20261116
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const between = (min, max) => Math.floor(random() * (max - min + 1)) + min
  const pick = (list) => list[Math.floor(random() * list.length)]
  const pickSome = (list, n) => [...list].sort(() => random() - 0.5).slice(0, n)
  const daysFromNow = (days, hour = between(8, 18)) => {
    const d = new Date(NOW.getTime() + days * DAY)
    d.setHours(hour, pick([0, 30]), 0, 0)
    return d
  }
  const notInFuture = (d) => new Date(Math.min(d.getTime(), NOW.getTime()))
  const timestamps = (d) => ({ createdAt: notInFuture(d), updatedAt: notInFuture(d) })

  // --- Contenus ---
  const FIRST_NAMES = ['Léa', 'Hugo', 'Inès', 'Lucas', 'Manon', 'Yanis', 'Sarah', 'Nathan', 'Camille',
    'Adam', 'Jade', 'Mehdi', 'Zoé', 'Louis', 'Amina', 'Théo']
  const LAST_NAMES = ['Bernard', 'Petit', 'Moreau', 'Laurent', 'Fontaine', 'Benali', 'Rousseau', 'Leroy',
    'Garnier', 'Traoré', 'Faure', 'Mercier', 'Chevalier', 'Lambert', 'Nguyen', 'Haddad']
  const STUDENT_BIOS = [
    "Étudiant en L2 d'informatique, dispo le soir et le week-end.",
    'En BTS, je cherche des petites missions pour financer mon permis.',
    "Étudiante en licence de maths, j'adore expliquer.",
    'Sportif, motivé, à l’aise pour porter et monter des meubles.',
    "J'ai grandi avec des chiens et des chats, je m'en occupe avec plaisir.",
    'Bricoleur depuis le collège, outils fournis si besoin.',
  ]
  const CLIENT_BIOS = [
    'Maman de deux enfants, toujours à la recherche de coups de main.',
    'Retraité, je ne peux plus porter de charges lourdes.',
    'Je travaille beaucoup, un peu d’aide le week-end me sauve.',
    '',
  ]
  // [titre, description, prime min €, prime max €, durées possibles en minutes]
  const TEMPLATES = {
    bricolage: [
      ['Monter une armoire 2 portes', 'Armoire en kit déjà livrée, notice et outils fournis. Il faut être deux pour la redresser à la fin.', 30, 50, [90, 120]],
      ['Fixer des étagères au mur', 'Trois étagères à poser dans le salon, mur en placo. J’ai les chevilles, il faut une perceuse.', 20, 35, [60, 90]],
      ['Changer une poignée de porte', 'Poignée cassée sur la porte de la chambre, la nouvelle est achetée.', 10, 15, [30]],
    ],
    informatique: [
      ['Installer une imprimante Wi-Fi', 'Imprimante neuve à connecter à l’ordinateur portable et au téléphone.', 15, 25, [45, 60]],
      ['Aide pour créer un site vitrine', 'Je tiens une petite boutique et voudrais une page simple avec horaires et photos.', 40, 80, [180, 240]],
      ['Récupérer des photos d’un vieux téléphone', 'Transférer les photos d’un ancien smartphone vers l’ordinateur et une clé USB.', 15, 25, [60]],
    ],
    'soutien-scolaire': [
      ['Cours de maths niveau 4e', 'Révisions des équations et du théorème de Pythagore avant le contrôle.', 18, 25, [60, 90]],
      ['Aide aux devoirs en anglais', 'Accompagner mon fils (CM2) pour ses devoirs d’anglais, deux soirs par semaine.', 15, 20, [60]],
      ['Préparation au brevet de français', 'Méthodologie de la rédaction et révisions de grammaire.', 20, 30, [90, 120]],
    ],
    courses: [
      ['Courses au supermarché', 'Liste d’une vingtaine d’articles, je règle les courses à part. Pas de charges lourdes.', 10, 15, [45, 60]],
      ['Récupérer un colis en point relais', 'Colis de 8 kg à récupérer et à monter au 4e sans ascenseur.', 8, 12, [30]],
    ],
    demenagement: [
      ['Aide au déménagement d’un studio', 'Porter des cartons et quelques meubles jusqu’au camion. 2e étage avec ascenseur.', 40, 70, [180, 240]],
      ['Descendre des meubles à la cave', 'Une commode et un vieux fauteuil à descendre à la cave.', 20, 30, [60]],
    ],
    animaux: [
      ['Promener mon chien le midi', 'Labrador très gentil, promenade de 45 minutes au parc pendant ma pause.', 10, 15, [45, 60]],
      ['Garder mon chat pendant le week-end', 'Passer nourrir le chat et changer la litière, samedi et dimanche.', 20, 30, [60]],
    ],
    jardinage: [
      ['Tondre la pelouse', 'Petit jardin d’environ 80 m², tondeuse électrique fournie.', 20, 30, [60, 90]],
      ['Tailler une haie', 'Haie de thuyas d’une dizaine de mètres, taille-haie fourni.', 30, 45, [120, 180]],
    ],
    'garde-enfants': [
      ['Sortie d’école et goûter', 'Récupérer ma fille (6 ans) à l’école à 16 h 30 et la garder jusqu’à 19 h.', 25, 35, [150, 180]],
      ['Baby-sitting samedi soir', 'Deux enfants de 4 et 7 ans, couchés vers 21 h.', 40, 55, [240, 300]],
    ],
  }
  const APPLICATION_MESSAGES = [
    "Bonjour, je suis disponible à cette date et j'ai déjà fait ce genre de mission.",
    'Bonjour ! Je suis étudiant dans le quartier, je peux venir à l’heure qui vous arrange.',
    'Je suis intéressée, j’ai de l’expérience et je suis ponctuelle.',
    'Disponible et motivé, je peux aussi venir un peu plus tôt si besoin.',
    "Bonjour, ça me correspond bien, je peux apporter mes outils.",
  ]
  const REVIEW_COMMENTS = {
    5: ['Parfait, ponctuel et très efficace. Je recommande !', 'Super échange, merci beaucoup !', 'Travail soigné, rien à redire.'],
    4: ['Très bien, petit retard mais prévenu à l’avance.', 'Bonne mission, personne agréable.'],
    3: ['Correct, mais la mission a pris plus de temps que prévu.'],
  }

  // --- Fabrication des documents ---
  const makeUser = ({ firstName, lastName, city, bio, skills = [], phone = true }) => ({
    _id: new ObjectId(),
    email: `${firstName}.${lastName}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z.]/g, '') + DEMO_DOMAIN,
    passwordHash: DEMO_PASSWORD_HASH,
    firstName,
    lastName,
    ...(phone && { phone: `06${between(10000000, 99999999)}` }),
    city,
    ...(bio && { bio }),
    skills,
    role: 'client',
    ...timestamps(daysFromNow(-between(20, 60))),
  })

  const makeMission = (owner, category, { status = 'open', quartier = pick(QUARTIERS), template, days, urgent } = {}) => {
    const [title, description, minEur, maxEur, minutesList] = template || pick(TEMPLATES[category])
    const [lng, lat] = quartier.coordinates
    const scheduledAt = days !== undefined ? daysFromNow(days)
      : status === 'completed' ? daysFromNow(-between(3, 25)) : daysFromNow(between(1, 21))
    const createdAt = new Date(Math.min(scheduledAt.getTime() - between(2, 10) * DAY, NOW.getTime() - between(1, 48) * 3600000))
    const estimatedMinutes = pick(minutesList)
    return {
      _id: new ObjectId(),
      ownerId: owner._id,
      providerId: null,
      title,
      description,
      rewardCents: between(minEur, maxEur) * 100,
      estimatedMinutes,
      category,
      scheduledAt,
      quartier: quartier.slug,
      // Léger décalage autour du centre du quartier pour que les marqueurs ne se superposent pas.
      location: { type: 'Point', coordinates: [lng + (random() - 0.5) * 0.012, lat + (random() - 0.5) * 0.008] },
      status,
      urgent: urgent ?? random() < 0.15,
      completedAt: status === 'completed' ? new Date(scheduledAt.getTime() + estimatedMinutes * 60000) : null,
      ...timestamps(createdAt),
    }
  }

  const makeApplication = (mission, applicant, status) => ({
    _id: new ObjectId(), missionId: mission._id, applicantId: applicant._id, message: pick(APPLICATION_MESSAGES), status,
    ...timestamps(new Date(mission.createdAt.getTime() + between(1, 30) * 3600000)),
  })

  const makeReview = (mission, author, target) => {
    const rating = pick([5, 5, 5, 4, 4, 3])
    return {
      _id: new ObjectId(), missionId: mission._id, authorId: author._id, targetId: target._id, rating, comment: pick(REVIEW_COMMENTS[rating]),
      ...timestamps(new Date(mission.completedAt.getTime() + between(2, 48) * 3600000)),
    }
  }

  // Mission attribuée ou terminée : prestataire accepté, autres candidats refusés.
  const assign = (mission, provider, others, applications) => {
    mission.providerId = provider._id
    applications.push(makeApplication(mission, provider, 'accepted'))
    others.forEach((u) => applications.push(makeApplication(mission, u, 'rejected')))
  }

  // --- Suppression de l'ancienne démo (si RESET) ou arrêt si elle existe déjà ---
  const alreadySeeded = database.users.countDocuments({ email: `alice.martin${DEMO_DOMAIN}` }) > 0
  if (alreadySeeded && !RESET) {
    print('La démo est déjà en base : rien n’a été inséré. Mettre RESET = true en haut de ce bloc pour la régénérer.')
  } else {
    if (alreadySeeded) {
      const userIds = database.users.find({ email: { $regex: '@helpup\\.test$' } }, { _id: 1 }).toArray().map((u) => u._id)
      const missionIds = database.missions.find({ ownerId: { $in: userIds } }, { _id: 1 }).toArray().map((m) => m._id)
      const r = database.reviews.deleteMany({ $or: [{ missionId: { $in: missionIds } }, { authorId: { $in: userIds } }, { targetId: { $in: userIds } }] })
      const a = database.applications.deleteMany({ $or: [{ missionId: { $in: missionIds } }, { applicantId: { $in: userIds } }] })
      const m = database.missions.deleteMany({ _id: { $in: missionIds } })
      const u = database.users.deleteMany({ _id: { $in: userIds } })
      print(`  Démo précédente supprimée : ${u.deletedCount} comptes, ${m.deletedCount} missions, ${a.deletedCount} candidatures, ${r.deletedCount} avis`)
    }

    // --- Comptes ---
    const alice = makeUser({ firstName: 'Alice', lastName: 'Martin', city: 'Paris 14e', bio: 'Je publie des missions pour ma famille et mes voisins.' })
    const bob = makeUser({ firstName: 'Bob', lastName: 'Nguyen', city: 'Villejuif', bio: STUDENT_BIOS[0], skills: ['informatique', 'soutien-scolaire', 'bricolage'] })
    const chloe = makeUser({ firstName: 'Chloé', lastName: 'Diallo', city: 'Ivry-sur-Seine', bio: STUDENT_BIOS[4], skills: ['animaux', 'garde-enfants', 'jardinage'] })
    const names = pickSome(FIRST_NAMES, 12).map((f, i) => [f, LAST_NAMES[i]])
    const students = names.slice(0, 7).map(([firstName, lastName]) => makeUser({
      firstName, lastName, city: pick(['Villejuif', 'Paris 13e', 'Ivry-sur-Seine', 'Le Kremlin-Bicêtre', 'Paris 14e']),
      bio: pick(STUDENT_BIOS), skills: pickSome(Object.keys(TEMPLATES), between(1, 3)),
    }))
    const clients = names.slice(7).map(([firstName, lastName]) => makeUser({
      firstName, lastName, city: pick(['Paris 13e', 'Paris 14e', 'Paris 15e', 'Villejuif']), bio: pick(CLIENT_BIOS), phone: random() < 0.6,
    }))
    const users = [alice, bob, chloe, ...students, ...clients]
    const helpers = [bob, chloe, ...students]
    const missions = []
    const applications = []
    const reviews = []
    const tpl = (category, i) => TEMPLATES[category][i]

    // --- Scénario fixe de la soutenance ---
    // 1. Alice : mission ouverte avec 3 candidatures en attente (elle accepte Bob en direct).
    const armoire = makeMission(alice, 'bricolage', { quartier: q('paris-14-alesia'), template: tpl('bricolage', 0), days: 4, urgent: false })
    missions.push(armoire)
    ;[bob, chloe, students[0]].forEach((u) => applications.push(makeApplication(armoire, u, 'pending')))
    // 2. Alice : mission attribuée à Chloé, Bob refusé.
    const demenagement = makeMission(alice, 'demenagement', { status: 'assigned', quartier: q('paris-14-denfert'), template: tpl('demenagement', 0), days: 6 })
    missions.push(demenagement)
    assign(demenagement, chloe, [bob], applications)
    // 3. Alice : mission terminée par Bob, avec les deux avis.
    const maths = makeMission(alice, 'soutien-scolaire', { status: 'completed', quartier: q('paris-14-alesia'), template: tpl('soutien-scolaire', 0), days: -5 })
    missions.push(maths)
    assign(maths, bob, [], applications)
    reviews.push(makeReview(maths, alice, bob), makeReview(maths, bob, alice))
    // 4. Alice : mission ouverte sans candidature (état vide).
    missions.push(makeMission(alice, 'jardinage', { quartier: q('paris-14-denfert'), template: tpl('jardinage', 1), days: 10, urgent: true }))
    // 5. Chloé publie aussi : un compte peut publier ET postuler.
    const chat = makeMission(chloe, 'animaux', { quartier: q('ivry-centre'), template: tpl('animaux', 1), days: 3 })
    missions.push(chat)
    applications.push(makeApplication(chat, students[1], 'pending'))

    // --- Missions générées (catalogue et carte remplis) ---
    const statuses = [...Array(19).fill('open'), ...Array(3).fill('assigned'), ...Array(4).fill('completed'), 'cancelled']
    const owners = [...clients, ...clients, alice]
    statuses.forEach((status) => {
      const owner = pick(owners)
      const mission = makeMission(owner, pick(Object.keys(TEMPLATES)), { status })
      missions.push(mission)
      const candidates = pickSome(helpers, between(0, 3))
      if (status === 'open') {
        candidates.forEach((u) => applications.push(makeApplication(mission, u, random() < 0.15 ? 'withdrawn' : 'pending')))
      } else if (status === 'assigned' || status === 'completed') {
        const [provider, ...others] = candidates.length ? candidates : [pick(helpers)]
        assign(mission, provider, others, applications)
        if (status === 'completed') {
          reviews.push(makeReview(mission, owner, provider))
          if (random() < 0.7) reviews.push(makeReview(mission, provider, owner))
        }
      }
    })

    database.users.insertMany(users)
    database.missions.insertMany(missions)
    database.applications.insertMany(applications)
    database.reviews.insertMany(reviews)
    print(`  ✓ ${users.length} comptes, ${missions.length} missions, ${applications.length} candidatures, ${reviews.length} avis`)
    print('\nComptes de démo (mot de passe : password123) :')
    print('  alice.martin@helpup.test   publie des missions (1 ouverte avec 3 candidats, 1 attribuée, 1 terminée)')
    print('  bob.nguyen@helpup.test     étudiant (candidatures en attente, refusée, mission terminée)')
    print('  chloe.diallo@helpup.test   publie et postule')
    print(`  + ${users.length - 3} autres comptes ${DEMO_DOMAIN}, même mot de passe.`)
  }
}
