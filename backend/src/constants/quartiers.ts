// Quartiers proposés à la création d'une mission (Paris sud + Villejuif).
// Le serveur en déduit `location` : l'utilisateur ne saisit jamais de coordonnées.
// Coordonnées approximatives du centre du quartier, en [longitude, latitude] (ordre GeoJSON).
// Toute modification doit être reportée dans backend/sql/seed.js (et son bloc dans migration/seed-demo.js).
export const QUARTIERS = [
  { slug: 'paris-13-butte-aux-cailles', label: 'Paris 13e · Butte-aux-Cailles', coordinates: [2.35, 48.827] },
  { slug: 'paris-13-place-d-italie', label: "Paris 13e · Place d'Italie", coordinates: [2.3555, 48.831] },
  { slug: 'paris-13-bibliotheque', label: 'Paris 13e · Bibliothèque F. Mitterrand', coordinates: [2.377, 48.83] },
  { slug: 'paris-14-denfert', label: 'Paris 14e · Denfert-Rochereau', coordinates: [2.332, 48.834] },
  { slug: 'paris-14-alesia', label: 'Paris 14e · Alésia', coordinates: [2.327, 48.828] },
  { slug: 'paris-15-convention', label: 'Paris 15e · Convention', coordinates: [2.296, 48.837] },
  { slug: 'paris-15-beaugrenelle', label: 'Paris 15e · Beaugrenelle', coordinates: [2.283, 48.848] },
  { slug: 'kremlin-bicetre', label: 'Le Kremlin-Bicêtre', coordinates: [2.358, 48.81] },
  { slug: 'ivry-centre', label: 'Ivry-sur-Seine · Centre', coordinates: [2.387, 48.813] },
  { slug: 'villejuif-centre', label: 'Villejuif · Centre', coordinates: [2.364, 48.7875] },
  { slug: 'villejuif-paul-vaillant-couturier', label: 'Villejuif · Paul Vaillant-Couturier', coordinates: [2.368, 48.796] },
] as const

export type Quartier = (typeof QUARTIERS)[number]
export type QuartierSlug = Quartier['slug']

// Tuple non vide : utilisable directement dans z.enum(QUARTIER_SLUGS) et dans un enum Mongoose.
export const QUARTIER_SLUGS = QUARTIERS.map((q) => q.slug) as [QuartierSlug, ...QuartierSlug[]]

export const findQuartier = (slug: string): Quartier | undefined => QUARTIERS.find((q) => q.slug === slug)
