# Charte graphique — HelpUP

> Identité **vert foncé + orange**, alignée sur les Human Interface Guidelines (HIG) d'Apple.
> Le site est une application web React : on applique les **principes** et les **fondations** des HIG
> (accessibilité, couleur, typographie, mise en page, écriture), pas les conventions propres à iOS/macOS.
> Chaque règle venant des HIG cite sa page (`fichier.md › Section`). Le reste est un choix de l'équipe.

---

## 1. Intention

**Le rôle du site en une phrase** : montrer à un étudiant une mission rémunérée près de chez lui, et à un particulier quelqu'un de confiance pour l'aider.

**Trois principes visuels** (ils découlent des principes *Purpose*, *Simplicity* et *Responsibility* d'Apple) :

| Principe | Ce qu'on vérifie sur chaque écran |
|---|---|
| **Clarté** | Une mission se comprend en 3 secondes : quoi, où, combien, quand. |
| **Proximité** | La distance et le quartier sont toujours visibles, la carte est un outil, pas une décoration. |
| **Confiance** | La prime, le profil du demandeur et son statut « vérifié » ne sont jamais cachés. |

**Élément signature : la pastille de prix.** `25 €` dans une pastille verte, sur les cartes de mission et sur les marqueurs de la carte.
C'est la seule chose qui doit « crier » ; tout le reste de l'interface reste calme.
> `branding.md › Best practices` : « Ensure branding always defers to content. »

**Ce qu'on évite** : le look « fond crème + accent orange + serif » qu'on retrouve sur beaucoup de sites générés. Ici, la couleur dominante est le **vert**, la typographie est **sans serif**, et l'orange est réservé aux **signaux** (urgent, nouveau), jamais à la décoration.

---

## 2. Couleurs

### 2.1 Palette de marque

| Nom | Hex | Rôle |
|---|---|---|
| **Forest Green** | `#174F40` | Couleur de marque : action principale, prix, lien, sélection |
| **Soft Orange** | `#F3A66B` | Signal : urgent, nouveau, notification non lue |
| Sage | `#D8EBDD` | Surfaces secondaires, badges de statut |
| Warm Cream | `#F7F6F0` | Fond de page |
| Charcoal | `#242B27` | Texte principal |
| Light Gray | `#E8EBE7` | Séparateurs (décoratifs uniquement) |

Répartition visée : **60 %** fonds crème et blancs · **25 %** vert et ses déclinaisons · **10 %** neutres · **5 %** orange.

### 2.2 Les deux règles qui comptent

1. **Une couleur = un sens.**
   - Vert = « c'est l'action principale / c'est la marque / c'est sélectionné ».
   - Orange = « attention, c'est urgent ou nouveau ».
   - Rouge = « action destructive ou erreur ». Rien d'autre.
   > `color.md › Best practices` : « Avoid using the same color to mean different things. »

2. **L'orange n'est jamais une couleur de texte sur fond clair.**
   `#F3A66B` sur crème = **1,85:1**, très loin des 7:1 visés. L'orange sert de **fond** (avec texte Charcoal, 7,23:1), ou on utilise sa version foncée `--color-signal-ink` `#793811` pour du texte (8,1:1).
   > `accessibility.md › Vision` : « Strive to meet color contrast minimum standards. » Apple cite les seuils WCAG **AA** (4,5:1, 3:1) comme minimum ; HelpUP vise le niveau **AAA** (7:1 pour le texte, 4,5:1 pour le grand texte), voir `docs/accessibilite.md`.

### 2.3 Couleurs sémantiques (clair et sombre)

Le code n'utilise **jamais** un hex directement : uniquement ces variables. Le mode sombre suit le réglage du système (`prefers-color-scheme`), **sans bouton propre au site**.
> `dark-mode.md › Best practices` : « Avoid offering an app-specific appearance setting. »
> `color.md › Best practices` : « Make sure all your app's colors work well in light, dark, and increased contrast contexts. »

Objectif : **WCAG 2.2 niveau AAA** (critère 1.4.6) dans les deux apparences : 7:1 pour tout texte, 3:1 pour les bordures de champ.

| Variable | Usage | Clair | Contraste | Sombre | Contraste |
|---|---|---|---|---|---|
| `--color-bg` | Fond de page | `#F7F6F0` | — | `#121614` | — |
| `--color-surface` | Cartes, panneaux, champs | `#FFFFFF` | — | `#1C211E` | — |
| `--color-surface-tinted` | Badges, zones secondaires | `#D8EBDD` | — | `#1E3A31` | — |
| `--color-label` | Texte principal | `#242B27` | 13,4 (bg) · 14,5 (surface) | `#EDEFEA` | 15,8 (bg) · 14,1 (surface) |
| `--color-label-secondary` | Texte secondaire, méta | `#464C49` | 8,1 (bg) · 7,0 (tinted) | `#BFC5C1` | 10,4 (bg) · 7,0 (tinted) |
| `--color-tint` | Marque, liens, prix, sélection, anneau de focus | `#174F40` | 8,7 (bg) · 7,6 (tinted) | `#8DD2B5` | 10,4 (bg) · 7,0 (tinted) |
| `--color-tint-pressed` | Bouton principal appuyé | `#123F33` | — | `#A9DFC8` | — |
| `--color-on-tint` | Texte sur fond vert | `#FFFFFF` | 9,4 | `#0E2A22` | 8,8 (10,3 appuyé) |
| `--color-signal` | Fond « urgent / nouveau » | `#F3A66B` | — | `#F3A66B` | — |
| `--color-on-signal` | Texte sur fond orange | `#242B27` | 7,2 | `#121614` | 9,1 |
| `--color-signal-ink` | Texte orange (rare) | `#793811` | 8,1 (bg) · 8,8 (surface) | `#F3A66B` | 8,1 (surface) |
| `--color-danger` | Supprimer, erreur | `#9A211A` | 7,4 (bg) · 7,0 (danger-surface) | `#FF9187` | 7,5 (surface) · 7,0 (danger-surface) |
| `--color-field-border` | Bordure des champs | `#88908B` | 3,3 (surface) · 3,0 (bg) | `#6F7873` | 3,6 (surface) |
| `--color-separator` | Bordure de carte, séparateur | `#E8EBE7` | décoratif | `#2E3632` | décoratif |

Contrastes calculés selon WCAG 2.2 à partir des valeurs hex (novembre 2026 : texte secondaire, vert sombre, encre orange et rouge foncés ou éclaircis pour passer de AA à AAA, sans changer leur teinte).
Quand le système demande **plus de contraste** (`prefers-contrast: more`), le texte secondaire prend la couleur du texte principal et les séparateurs deviennent des bordures visibles.
> `accessibility.md › Vision` : « ensure it at least provides a higher contrast color scheme when the system setting Increase Contrast is turned on. » Une bordure de champ doit atteindre 3:1 car elle indique où cliquer ; un séparateur purement décoratif n'a pas d'exigence.

### 2.4 Jamais la couleur seule

Chaque statut a **une icône + un libellé**, la couleur ne fait que renforcer.
> `color.md › Inclusive color` : « Avoid relying solely on color to differentiate between objects, indicate interactivity, or communicate essential information. »

| Statut de mission | Icône Lucide | Style |
|---|---|---|
| Ouverte | `circle-dot` | fond `surface-tinted`, texte `tint` |
| Attribuée | `user-check` | fond `surface-tinted`, texte `label` |
| En cours | `loader` | fond `surface-tinted`, texte `label` |
| Terminée | `check-circle-2` | fond `surface`, bordure `separator`, texte `label-secondary` |
| Annulée | `x-circle` | fond `surface`, texte `label-secondary` |
| **Urgente** (option) | `zap` | fond `signal`, texte `on-signal` |

| Candidature | Icône | Style |
|---|---|---|
| En attente | `clock` | neutre (`surface-tinted` + `label`) |
| Acceptée | `check` | `tint` + `on-tint` |
| Refusée | `x` | neutre (`surface` + `label-secondary`) — **pas de rouge** : ce n'est ni une erreur ni une action destructive |
| Retirée | `undo-2` | neutre |

---

## 3. Typographie

### 3.1 Deux familles, un rôle chacune

| Rôle | Police | Pourquoi |
|---|---|---|
| **Titres, prix, moments de marque** | **Plus Jakarta Sans** (variable) | Porte la personnalité : géométrique, chaleureuse |
| **Texte courant, boutons, champs, méta** | **Police système** (SF Pro sur Apple, Segoe UI sur Windows, Roboto sur Android) | Lisibilité maximale en petite taille, rendu natif |

> `branding.md › Best practices` : « It can work well to use a custom font for headlines and subheadings while using system fonts for body copy and captions, because the system fonts are designed for optimal legibility at small sizes. »
> `typography.md › Conveying hierarchy` : « Minimize the number of typefaces you use. » → deux familles maximum, pas une de plus.

Plus Jakarta Sans est servie depuis le projet (paquet npm `@fontsource-variable/plus-jakarta-sans`), pas depuis Google Fonts : pas d'appel à un service tiers, et ça marche hors ligne pendant la démo.

```css
--font-display: "Plus Jakarta Sans Variable", system-ui, sans-serif;
--font-text: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

### 3.2 Échelle

Tailles en `rem` pour suivre le zoom et la taille de texte choisie par l'utilisateur (l'équivalent web du *Dynamic Type* d'Apple).
> `typography.md › Ensuring legibility` : taille par défaut 17 pt sur mobile (minimum 11 pt), 13 pt sur desktop (minimum 10 pt).
> Sur le web, on garde **16 px minimum pour le corps** (17 px sur mobile) et **12 px minimum** pour tout texte.

| Style | Usage | Police | Taille | Graisse | Interligne |
|---|---|---|---|---|---|
| `display` | Hero de la page d'accueil | Jakarta | `clamp(2.25rem, 5vw, 3.5rem)` (36→56 px) | 700 | 1.1 |
| `title-1` | Titre de page / section | Jakarta | `clamp(1.75rem, 3vw, 2rem)` (28→32 px) | 700 | 1.2 |
| `title-2` | Sous-section, titre de fiche | Jakarta | 1.375rem (22 px) | 600 | 1.25 |
| `headline` | Titre de carte de mission | Jakarta | 1.0625rem (17 px) | 600 | 1.3 |
| `price` | Prime d'une mission | Jakarta | 1.375rem (22 px) · 1.5rem en fiche | 700 | 1 |
| `body` | Texte courant | Système | 1rem (16 px) · 1.0625rem (17 px) sous 640 px | 400 | 1.5 |
| `callout` | Boutons, champs | Système | 1rem (16 px) | 600 (boutons) / 400 | 1.25 |
| `footnote` | Méta : distance, date, auteur | Système | 0.8125rem (13 px) | 500 | 1.35 |
| `caption` | Badges, mentions légales | Système | 0.75rem (12 px) | 500 | 1.3 |

Règles :
- **Pas de graisse inférieure à 400.** > `typography.md › Ensuring legibility` : « In general, avoid light font weights. »
- La hiérarchie passe par **taille + graisse + couleur**, pas par les majuscules ni la couleur seule.
- Prix : `font-variant-numeric: tabular-nums` pour que les montants s'alignent dans une liste.
- À 200 % de zoom, aucune information ne disparaît et le texte ne se coupe pas : les cartes passent sur une colonne.
  > `typography.md › Supporting Dynamic Type` : « Maintain a consistent information hierarchy regardless of the current font size. »

---

## 4. Espacement, formes, mise en page

### 4.1 Grille de 4 px

`4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64` — aucune autre valeur.

### 4.2 Formes

| Élément | Rayon | Bordure / ombre |
|---|---|---|
| Carte de mission | 16 px | 1 px `separator`, pas d'ombre au repos |
| Bouton | 12 px | — |
| Champ de saisie | 10 px | 1 px `field-border` |
| Badge, pastille de prix, marqueur | 999 px (pilule) | — |
| Feuille / modale | 20 px (coins du haut sur mobile) | ombre douce |

Ombre unique, réservée au survol et aux éléments flottants :
`--shadow-raised: 0 1px 2px rgb(23 79 64 / 0.06), 0 8px 24px rgb(23 79 64 / 0.08);`

### 4.3 Cibles et espacement des contrôles

- Toute zone cliquable fait **au moins 44 × 44 px**, **sans exception** (WCAG 2.5.5 AAA) : boutons, petits boutons (`.btn--sm` est plus compact visuellement mais garde 44 px de haut), puces, filtres, croix de fermeture, étoiles de notation, cloche. 48 px pour l'action principale d'un écran. Les marqueurs de la carte (32 px de haut) ont une zone cliquable agrandie à 44 px. Variable : `--target-min`.
  > `buttons.md › Best practices` : « A button needs a hit region of at least 44x44 pt. »
- **12 px** minimum entre deux boutons ; **24 px** autour d'un lien ou d'une icône sans fond.
  > `accessibility.md › Mobility` : « Add about 12 points of padding around elements that include a bezel. For elements without a bezel, about 24 points of padding works well. »

### 4.4 Mise en page adaptative

La mise en page dépend de la **largeur disponible**, pas de l'appareil, et **les mêmes fonctions existent à toutes les tailles**.
> `layout.md › Size classes` : « Keep functionality the same as size classes change. »

| Largeur | Nom | Missions |
|---|---|---|
| < 640 px | compact | 1 colonne ; bascule **Liste / Carte** |
| 640–1023 px | regular | 2 colonnes de cartes ; carte en plein écran via la bascule |
| ≥ 1024 px | wide | Liste à gauche (≈ 420 px) + carte à droite, synchronisées |

```
 compact (< 640 px)              wide (≥ 1024 px)
┌──────────────────────┐        ┌───────────────────────────────────────────────┐
│ HelpUP        🔔  👤 │ ← barre│ HelpUP   Missions  Carte  Candidatures  🔔  👤 │
├──────────────────────┤ glass  ├──────────────────┬────────────────────────────┤
│ 🔍 Une mission ?     │        │ 🔍 Rechercher     │                            │
│ [Tout][Bricolage]… → │        │ [Catégorie][Prix]│      ( 25 € )              │
├──────────────────────┤        ├──────────────────┤              ( 18 € )      │
│ ┌──────────────────┐ │        │ ┌──────────────┐ │   (3)                      │
│ │ carte mission    │ │        │ │ carte mission│◄┼──── survol = marqueur      │
│ └──────────────────┘ │        │ └──────────────┘ │      mis en avant          │
│ ┌──────────────────┐ │        │ ┌──────────────┐ │                ( 45 € )    │
│ │ carte mission    │ │        │ │ carte mission│ │                            │
│ └──────────────────┘ │        │ └──────────────┘ │                     [+][-] │
│      [ Liste | Carte ]│ ← flottant              │                            │
└──────────────────────┘        └──────────────────┴────────────────────────────┘
```

---

## 5. Matière translucide (effet « verre »)

Le flou d'arrière-plan est réservé à la **couche des contrôles flottants** : barre de navigation, bascule Liste/Carte, boutons de zoom de la carte. **Jamais** sur les cartes de mission, les listes ou les fonds.
> `liquid-glass.md` : « Glass appears only on floating controls and navigation. Glass on app backgrounds, cards, list rows, or content containers is a defect. »

```css
.glass {
  background: rgb(247 246 240 / 0.72);           /* crème translucide */
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
  backdrop-filter: blur(24px) saturate(1.4);
  border: 1px solid rgb(255 255 255 / 0.5);
}
@media (prefers-color-scheme: dark) {
  .glass { background: rgb(18 22 20 / 0.72); border-color: rgb(255 255 255 / 0.08); }
}
/* Repli opaque si l'utilisateur réduit la transparence ou augmente le contraste */
@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {
  .glass { background: var(--color-surface); -webkit-backdrop-filter: none; backdrop-filter: none;
           border-color: var(--color-field-border); }
}
```

---

## 6. Composants

Les composants restent **familiers** (un bouton ressemble à un bouton, un champ à un champ) ; la marque passe par la couleur, la typo et le ton.
> `branding.md › Best practices` : « Express your brand with familiar components. »

### 6.1 Boutons

| Style | Usage | Apparence |
|---|---|---|
| **Principal** | L'action la plus probable de l'écran : « Publier la mission », « Postuler » | fond `tint`, texte `on-tint`, 48 px |
| Secondaire | Actions courantes : « Filtres », « Voir le profil » | fond `surface-tinted`, texte `tint`, 44 px |
| Discret | Actions tertiaires : « Annuler », liens | texte `tint`, sans fond, 44 px de zone |
| Destructif | « Supprimer la mission » | texte `danger` (fond `danger` uniquement dans la confirmation) |

- **Un, au maximum deux boutons principaux par écran.**
  > `buttons.md › Style` : « Keep the number of prominent buttons to one or two per view. »
- On distingue les choix par le **style, pas par la taille**.
  > `buttons.md › Style` : « Use style — not size — to visually distinguish the preferred choice. »
- Le bouton principal n'est **jamais** orange (l'orange = signal) et **jamais** une action destructive.
  > `buttons.md › Role` : « Don't assign the primary role to a button that performs a destructive action. »
- États obligatoires : repos, survol, **appuyé** (`tint-pressed` + `scale(0.98)`), **focus clavier** (anneau 2 px `tint`, décalé de 2 px), désactivé (opacité 0.4, `cursor: not-allowed`), **chargement** (spinner à la place du libellé, largeur conservée).
  > `buttons.md › Best practices` : « Always include a press state for a custom button. »

### 6.2 Carte de mission

```
┌────────────────────────────────────────────┐
│ 🔨 Bricolage                  ⚡ Urgent    │ ← footnote · badge signal (si urgent)
│                                            │
│ Monter une armoire IKEA                    │ ← headline (Jakarta 600, 17 px)
│ Armoire 2 portes, outils fournis.          │ ← body, label-secondary, 2 lignes max
│                                            │
│ 📍 À 1,2 km · 📅 Sam. 14 déc. · ⏱ 2 h      │ ← footnote, label-secondary
│ ─────────────────────────────────────────  │ ← separator
│ (👤) Thomas · ✓ Vérifié          ( 45 € )  │ ← avatar + nom · pastille prix
└────────────────────────────────────────────┘
```

- Ordre de lecture : **catégorie → titre → infos pratiques → demandeur → prix**. Le prix est à droite, en bas, toujours au même endroit.
  > `layout.md › Visual hierarchy` : « Order content by relative importance. »
- Pastille de prix : fond `tint`, texte `on-tint`, Jakarta 700 22 px, `tabular-nums`.
- Toute la carte est cliquable (un seul lien vers la fiche), padding 20 px, rayon 16 px.
- Survol : bordure `field-border` + `--shadow-raised`. Focus clavier : anneau `tint`.
- Pas de bouton « Voir la mission » dans la carte : la carte entière l'est déjà (un élément = un rôle).

### 6.3 Champs de formulaire

- Libellé **au-dessus** du champ (jamais seulement un placeholder), exemple dans le champ.
  > `writing.md › Best practices` : « Show hints in text fields. »
- Hauteur 44 px, bordure `field-border`, focus : bordure 2 px `tint`.
- Erreur **sous le champ concerné**, en `danger`, avec icône `alert-circle` et une phrase qui dit quoi faire.
  > `writing.md › Best practices` : « Display it as close to the problem as possible, avoid blame, and be clear about what someone can do to fix it. »
- La prime se saisit avec un champ numérique (`inputmode="decimal"`) suffixé « € » ; la catégorie avec une liste de choix, pas un texte libre.

### 6.4 États vides, chargement, erreurs

- **Vide** : une phrase + une action. « Aucune mission dans ce rayon. » → bouton « Élargir à 10 km ».
  > `writing.md › Best practices` : « Provide clear next steps on any blank screens. »
- **Chargement** : squelettes de cartes (formes grises `surface-tinted`), jamais un écran blanc.
- **Confirmation destructive** : modale avec « Supprimer la mission » (danger) et « Annuler », Annuler est le choix par défaut.

---

## 7. La carte géographique

Leaflet + OpenStreetMap, style de fond clair et désaturé (rues gris pâle, parcs vert désaturé, eau bleu très léger). La carte ne prend pas les couleurs de la marque : ce sont les **marqueurs** qui les portent.

| Élément | Apparence |
|---|---|
| Marqueur au repos | Pilule blanche (`surface`), texte `tint` Jakarta 700 14 px : `25 €`, bordure 1 px `tint`, ombre légère |
| Marqueur survolé / lié à la carte survolée dans la liste | Pilule `tint`, texte `on-tint` |
| Marqueur **sélectionné** | Pilule `tint` agrandie (×1,15), anneau 3 px `surface`, passe au premier plan |
| Mission urgente | Petit point `signal` (8 px) en haut à droite de la pilule |
| Groupe (cluster) | Cercle `tint`, texte `on-tint` : nombre de missions |
| Position de l'utilisateur | Point bleu système (convention connue de toutes les cartes) |

> `maps.md › Custom information` : « Use annotations that match the visual style of your app. » — et garder le texte court (2 à 3 caractères recommandés) : on écrit `25 €`, sans centimes.
> `maps.md › Best practices` : « Clearly identify elements that people select [...] use distinct styling like an outline and color variation. »
> `maps.md › Best practices` : « Cluster overlapping points of interest to improve map legibility. »
> `maps.md › Custom information` : « Make sure there's enough contrast between custom controls and the map. » → contrôles de carte en matière `.glass` avec bordure.

- Cliquer un marqueur ouvre un **aperçu** (mini-carte de mission) sans cacher le marqueur ; cliquer l'aperçu ouvre la fiche.
  > `maps.md › Displaying place cards in a map` : « Keep the location on your map visible when displaying a place card. »
- L'attribution OpenStreetMap reste visible (obligation de licence).
- Chaque marqueur a un libellé accessible : `aria-label="Monter une armoire, 45 €, à 1,2 km"`.

---

## 8. Icônes

- **Lucide**, style contour, épaisseur **1,75 px** (2 px sous 16 px de taille), taille alignée sur le texte voisin (16 px avec `footnote`, 20 px avec `body`, 24 px dans la navigation).
- Une icône = un sens partout sur le site.

| Catégorie | Icône | | Catégorie | Icône |
|---|---|---|---|---|
| Bricolage | `hammer` | | Déménagement | `truck` |
| Informatique | `code` | | Animaux | `dog` |
| Soutien scolaire | `book-open` | | Jardinage | `leaf` |
| Courses | `shopping-basket` | | Garde d'enfants | `baby` |

- Un bouton avec **seulement une icône** a toujours un `aria-label` (« Fermer », « Ajouter aux favoris »).
  > `accessibility.md › Vision` : « Describe your app's interface and content for VoiceOver. »

---

## 9. Mouvement

Sobre et utile, jamais décoratif.

| Interaction | Animation |
|---|---|
| Appui sur un bouton | `scale(0.98)`, 100 ms |
| Survol d'une carte | bordure + ombre, 150 ms `ease-out` |
| Ouverture d'aperçu / modale | fondu + glissement 8 px, 200 ms |
| Sélection d'un marqueur | agrandissement, 150 ms |

Avec `prefers-reduced-motion: reduce` : plus de glissement ni d'agrandissement, uniquement des fondus.
> `accessibility.md › Cognitive` : « Be cautious with fast-moving and blinking animations. »

---

## 10. Écriture

**Voix** : directe, positive, on **tutoie**. On parle de petits services et d'argent de poche, pas d'« opportunités professionnelles ».
> `branding.md › Best practices` : « Use your brand's unique voice and tone in all the written communication you display. »

**Vocabulaire fixe** — un mot par idée, partout :
- *mission* (pas « annonce », « job », « tâche »)
- *prime* (pas « salaire », « rémunération » dans l'interface)
- *postuler* / *candidature*
- *demandeur* et *étudiant* dans l'interface ; on évite « client » et « prestataire »

**Capitalisation** : majuscule au premier mot seulement, partout (titres, boutons, menus). « Publier une mission », pas « Publier Une Mission ».
> `writing.md › Best practices` : « Adopt capitalization rules that align with your app's style, then apply them consistently. »

**Un bouton dit ce qu'il fait, et le résultat reprend le même verbe** :
« Publier la mission » → « Mission publiée » · « Postuler » → « Candidature envoyée » · pas de « Valider » ni « OK ».
> `writing.md › Best practices` : « Be action oriented. »

| ✗ À éviter | ✓ À écrire |
|---|---|
| « Erreur : champ invalide » | « Indique une prime d'au moins 5 €. » |
| « Oups ! Une erreur est survenue » | « Impossible d'envoyer ta candidature. Vérifie ta connexion et réessaie. » |
| « Mot de passe trop court » | « Choisis un mot de passe d'au moins 8 caractères. » |
| « Aucun résultat » | « Aucune mission ici pour l'instant. Élargis le rayon ou change de catégorie. » |

Accroches de marque : « Une mission près de chez toi ? » · « Ton temps a de la valeur. » · « Un coup de main, une petite prime. »

---

## 11. Accessibilité — à vérifier avant chaque démo

- [ ] Texte ≥ **7:1**, grand texte ≥ 4,5:1, bordures de champ et éléments graphiques ≥ 3:1 (tableau 2.3, niveau AAA).
- [ ] Aucun statut indiqué par la couleur seule (icône + libellé).
- [ ] Zones cliquables ≥ 44 × 44 px partout, 12 px entre deux boutons.
- [ ] Anneau de focus de 3 px (`--focus-ring-width`), jamais caché sous la barre de navigation (`scroll-padding-top`).
- [ ] Lien « Aller au contenu » en premier au clavier ; chaque page a son titre d'onglet, le focus va sur le `h1` à chaque changement de page.
- [ ] Texte : 80 caractères par ligne au plus, interligne 1,5, jamais justifié ; liens soulignés dans le texte.
- [ ] Tout le parcours se fait **au clavier** (Tab, Entrée, Échap ferme les modales), focus toujours visible.
- [ ] Zoom navigateur à 200 % : rien ne disparaît, rien ne déborde horizontalement.
- [ ] Mode sombre testé sur chaque écran.
- [ ] `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast` ont une réponse.
- [ ] Images : `alt` descriptif ; icônes seules : `aria-label`.
- [ ] Grille complète (RGAA, WCAG AAA) et procédure de test : `docs/accessibilite.md`.

> `accessibility.md › Speech` : « Let people use the keyboard alone to navigate and interact with your app. »

---

## 12. Variables CSS (à copier dans le frontend)

```css
:root {
  color-scheme: light dark;

  /* Couleurs — clair */
  --color-bg: #F7F6F0;
  --color-surface: #FFFFFF;
  --color-surface-tinted: #D8EBDD;
  --color-label: #242B27;
  --color-label-secondary: #464C49;
  --color-tint: #174F40;
  --color-tint-pressed: #123F33;
  --color-on-tint: #FFFFFF;
  --color-signal: #F3A66B;
  --color-on-signal: #242B27;
  --color-signal-ink: #793811;
  --color-danger: #9A211A;
  --color-field-border: #88908B;
  --color-separator: #E8EBE7;

  /* Typographie */
  --font-display: "Plus Jakarta Sans Variable", system-ui, sans-serif;
  --font-text: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --text-display: clamp(2.25rem, 5vw, 3.5rem);
  --text-title-1: clamp(1.75rem, 3vw, 2rem);
  --text-title-2: 1.375rem;
  --text-headline: 1.0625rem;
  --text-price: 1.375rem;
  --text-body: 1rem;
  --text-footnote: 0.8125rem;
  --text-caption: 0.75rem;

  /* Espacements (grille de 4 px) */
  --space-1: 4px;  --space-2: 8px;   --space-3: 12px; --space-4: 16px;
  --space-5: 20px; --space-6: 24px;  --space-8: 32px; --space-10: 40px;
  --space-12: 48px; --space-16: 64px;

  /* Formes */
  --radius-card: 16px;
  --radius-button: 12px;
  --radius-field: 10px;
  --radius-sheet: 20px;
  --radius-pill: 999px;
  --shadow-raised: 0 1px 2px rgb(23 79 64 / 0.06), 0 8px 24px rgb(23 79 64 / 0.08);

  /* Contrôles */
  --control-height: 44px;
  --control-height-primary: 48px;

  /* Mouvement */
  --duration-fast: 100ms;
  --duration-base: 150ms;
  --duration-slow: 200ms;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg: #121614;
    --color-surface: #1C211E;
    --color-surface-tinted: #1E3A31;
    --color-label: #EDEFEA;
    --color-label-secondary: #BFC5C1;
    --color-tint: #8DD2B5;
    --color-tint-pressed: #A9DFC8;
    --color-on-tint: #0E2A22;
    --color-signal: #F3A66B;
    --color-on-signal: #121614;
    --color-signal-ink: #F3A66B;
    --color-danger: #FF9187;
    --color-field-border: #6F7873;
    --color-separator: #2E3632;
    --shadow-raised: 0 1px 2px rgb(0 0 0 / 0.3), 0 8px 24px rgb(0 0 0 / 0.35);
  }
}

@media (max-width: 639px) {
  :root { --text-body: 1.0625rem; }
}

@media (prefers-reduced-motion: reduce) {
  :root { --duration-fast: 0ms; --duration-base: 0ms; --duration-slow: 0ms; }
}

body {
  background: var(--color-bg);
  color: var(--color-label);
  font: 400 var(--text-body)/1.5 var(--font-text);
}
```

---

## Sources

- Apple, *Human Interface Guidelines* (version locale du skill `apple-design`) : `branding.md`, `color.md`, `dark-mode.md`, `accessibility.md`, `typography.md`, `layout.md`, `buttons.md`, `maps.md`, `writing.md`, `liquid-glass.md`.
- W3C, *WCAG 2.2* niveau AAA : contraste amélioré 7:1 (1.4.6), cibles 44 px (2.5.5), apparence du focus (2.4.13).
- DINUM, *RGAA 4.1* : référentiel français, fondé sur WCAG 2.1 AA (voir `docs/accessibilite.md`).
- Contrastes calculés par l'équipe à partir des valeurs hex (formule de luminance relative WCAG).
