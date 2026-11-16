// Quartiers proposés à la création d'une mission (Paris sud + Villejuif).
// Le serveur en déduit `location` : l'utilisateur ne saisit jamais de coordonnées.
// Coordonnées approximatives du centre du quartier, en [longitude, latitude] (ordre GeoJSON).
const QUARTIERS = [
  { slug: 'paris-13-butte-aux-cailles', label: 'Paris 13e · Butte-aux-Cailles', coordinates: [2.3500, 48.8270] },
  { slug: 'paris-13-place-d-italie', label: "Paris 13e · Place d'Italie", coordinates: [2.3555, 48.8310] },
  { slug: 'paris-13-bibliotheque', label: 'Paris 13e · Bibliothèque F. Mitterrand', coordinates: [2.3770, 48.8300] },
  { slug: 'paris-14-denfert', label: 'Paris 14e · Denfert-Rochereau', coordinates: [2.3320, 48.8340] },
  { slug: 'paris-14-alesia', label: 'Paris 14e · Alésia', coordinates: [2.3270, 48.8280] },
  { slug: 'paris-15-convention', label: 'Paris 15e · Convention', coordinates: [2.2960, 48.8370] },
  { slug: 'paris-15-beaugrenelle', label: 'Paris 15e · Beaugrenelle', coordinates: [2.2830, 48.8480] },
  { slug: 'kremlin-bicetre', label: 'Le Kremlin-Bicêtre', coordinates: [2.3580, 48.8100] },
  { slug: 'ivry-centre', label: 'Ivry-sur-Seine · Centre', coordinates: [2.3870, 48.8130] },
  { slug: 'villejuif-centre', label: 'Villejuif · Centre', coordinates: [2.3640, 48.7875] },
  { slug: 'villejuif-paul-vaillant-couturier', label: 'Villejuif · Paul Vaillant-Couturier', coordinates: [2.3680, 48.7960] },
]

const QUARTIER_SLUGS = QUARTIERS.map((q) => q.slug)

const findQuartier = (slug) => QUARTIERS.find((q) => q.slug === slug)

module.exports = { QUARTIERS, QUARTIER_SLUGS, findQuartier }
