// Mêmes slugs que backend/src/constants/quartiers.ts (le serveur en déduit les coordonnées).
export const QUARTIERS: ReadonlyArray<{ slug: string; label: string }> = [
  { slug: 'paris-13-butte-aux-cailles', label: 'Paris 13e · Butte-aux-Cailles' },
  { slug: 'paris-13-place-d-italie', label: "Paris 13e · Place d'Italie" },
  { slug: 'paris-13-bibliotheque', label: 'Paris 13e · Bibliothèque F. Mitterrand' },
  { slug: 'paris-14-denfert', label: 'Paris 14e · Denfert-Rochereau' },
  { slug: 'paris-14-alesia', label: 'Paris 14e · Alésia' },
  { slug: 'paris-15-convention', label: 'Paris 15e · Convention' },
  { slug: 'paris-15-beaugrenelle', label: 'Paris 15e · Beaugrenelle' },
  { slug: 'kremlin-bicetre', label: 'Le Kremlin-Bicêtre' },
  { slug: 'ivry-centre', label: 'Ivry-sur-Seine · Centre' },
  { slug: 'villejuif-centre', label: 'Villejuif · Centre' },
  { slug: 'villejuif-paul-vaillant-couturier', label: 'Villejuif · Paul Vaillant-Couturier' },
]

export function quartierLabel(slug: string): string {
  return QUARTIERS.find((q) => q.slug === slug)?.label ?? slug
}
