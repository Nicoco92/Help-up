# Accessibilité — HelpUP

> Objectif : **WCAG 2.2 niveau AAA** là où il s'applique à une application web, ce qui couvre et dépasse le **RGAA 4.1** (référentiel français, fondé sur WCAG 2.1 niveau AA).
> Les choix de design suivent les Human Interface Guidelines d'Apple (skill `apple-design`, page `accessibility.md`) : la charte (`docs/charte-graphique.md`) reste la source des couleurs, des tailles et des composants.
> Ce document est un **audit interne**, pas une déclaration de conformité officielle : celle-ci demande un audit RGAA complet sur un échantillon de pages, par une personne formée.

## 1. Ce qui a été fait

| Sujet | Mesure | Critères |
|---|---|---|
| Contraste du texte | Tous les couples texte / fond atteignent **7:1**, en clair **et** en sombre (tableau §3). Le texte secondaire, le vert sombre, l'orange « encre » et le rouge ont été foncés ou éclaircis, sans changer de teinte | WCAG 1.4.6 (AAA) · RGAA 3.2 |
| Contraste renforcé | `prefers-contrast: more` : le texte secondaire devient noir, les séparateurs deviennent des bordures visibles | HIG `accessibility.md › Vision` |
| Couleurs forcées | `forced-colors: active` (contraste élevé de Windows) : boutons, badges et cartes gardent une bordure, le focus prend la couleur système | WCAG 1.4.11 |
| Couleur seule | Statuts = icône + libellé ; notification non lue = pastille « Nouveau » en texte ; note = étoiles **et** « Note : 4,5 sur 5 » ; liens soulignés dans le texte | WCAG 1.4.1 · RGAA 3.1 |
| Cibles | **44 × 44 px minimum partout** (`--target-min`) : petits boutons, puces, filtres, croix des alertes, étoiles, cloche, liens des infobulles de carte. Les marqueurs de carte ont une zone cliquable agrandie | WCAG 2.5.5 (AAA) · HIG `accessibility.md › Mobility` |
| Focus | Anneau de **3 px** (`--focus-ring-width`), 8,7:1 sur fond clair, 10,4:1 sur fond sombre ; les champs n'enlèvent plus l'anneau ; les marqueurs 3D ont un halo pour rester visibles sur la carte | WCAG 2.4.7, 2.4.13 (AAA) · RGAA 10.7 |
| Focus jamais caché | `scroll-padding-top` = hauteur de la barre de navigation collante | WCAG 2.4.11, 2.4.12 (AAA) |
| Lien d'évitement | « Aller au contenu », premier élément atteint au clavier, vers `<main id="contenu">` | WCAG 2.4.1 · RGAA 12.7 |
| Titre de page | Chaque route a son titre d'onglet (« Tableau de bord · HelpUP ») | WCAG 2.4.2 · RGAA 8.6 |
| Changement de page | Le focus va sur le `h1` de la nouvelle page et un message « Page : … » est annoncé (`RouteAnnouncer`) | WCAG 2.4.3 · RGAA 12.x |
| Emplacement | La page courante est marquée `aria-current="page"` dans la navigation (NavLink) | WCAG 2.4.8 (AAA) |
| Rôles ARIA | Filtres : groupes de boutons `aria-pressed` (plus de faux `role="tablist"`) ; menu du compte : bouton + panneau (`aria-expanded`, `aria-controls`) au lieu d'un `role="menu"` sans navigation aux flèches | WCAG 4.1.2 · RGAA 7.1 |
| Notation | Choix de la note = vrai groupe de boutons radio (`fieldset` + `legend`), utilisable aux flèches du clavier | WCAG 1.3.1, 2.1.1 · RGAA 11.5 |
| Messages d'état | Erreurs en `role="alert"`, confirmations et actions sur les notifications en `role="status"`, jamais de message qui disparaît tout seul | WCAG 4.1.3, 2.2.1 |
| Interruptions | La cloche se met à jour toutes les 30 s **sans annonce** ni fenêtre surgissante | WCAG 2.2.4 (AAA) |
| Session expirée | Après reconnexion, retour sur la page d'origine ; le texte en cours (candidature, avis) est gardé dans l'onglet (`useDraft`) | WCAG 2.2.5 (AAA) |
| Présentation du texte | Lignes de **80 caractères** au plus, interligne 1,5, espace entre paragraphes 1,5 em, jamais justifié | WCAG 1.4.8 (AAA) |
| Mouvement | `prefers-reduced-motion` : plus d'animation ni de transition, la carte 3D se place sans vol animé | WCAG 2.3.3 (AAA) · HIG `accessibility.md › Cognitive` |
| Prévention des erreurs | Confirmation avant d'accepter un candidat, de clôturer une mission ou de retirer une candidature | WCAG 3.3.4, 3.3.6 (AAA) |
| Formulaires | Libellés visibles, aide sous le champ, erreur reliée par `aria-describedby`, `autocomplete` sur les champs personnels | WCAG 1.3.5, 3.3.2 · RGAA 11 |
| Langue | `<html lang="fr">` | WCAG 3.1.1 · RGAA 8.3 |

## 2. Limites connues

- **Carte** : le fond de carte (OpenStreetMap, OpenFreeMap) n'est pas sous notre contrôle (contraste des noms de rues). La liste des missions donne la même information sans la carte (WCAG 1.1.1, alternative).
- **Formulaire de profil** : son brouillon n'est pas encore gardé si la session expire (le formulaire de Nicolas n'utilise pas `useDraft`).
- **Langage clair (3.1.5 AAA)** : les textes sont courts et au présent, mais aucun test de lisibilité n'a été mené.
- **Lint d'accessibilité** : `eslint-plugin-jsx-a11y` ne prend pas encore en charge ESLint 10 (dépendances d'ESLint 9 au plus) ; il n'est donc pas installé.
- **Tests avec lecteur d'écran** : à faire avant la soutenance (procédure §4).

## 3. Contrastes (WCAG 2.2, calculés depuis `frontend/src/styles/tokens.css`)

| Texte | Clair : fond / surface / teinté | Sombre : fond / surface / teinté |
|---|---|---|
| Principal `--color-label` | 13,4 / 14,5 / 11,6 | 15,8 / 14,1 / 10,6 |
| Secondaire `--color-label-secondary` | 8,1 / 8,8 / 7,0 | 10,4 / 9,3 / 7,0 |
| Marque, liens `--color-tint` | 8,7 / 9,4 / 7,6 | 10,4 / 9,3 / 7,0 |
| Sur bouton vert `--color-on-tint` | 9,4 | 8,8 |
| Sur fond orange `--color-on-signal` | 7,2 | 9,1 |
| Orange « encre » `--color-signal-ink` | 8,1 / 8,8 / — | 9,1 / 8,1 / — |
| Erreur `--color-danger` (et sur `--color-danger-surface`) | 7,4 / 8,1 / 7,0 | 8,4 / 7,5 / 7,0 |
| Bordure de champ (non textuel, 3:1) | 3,0 / 3,3 | 4,0 / 3,6 |

Seuils AAA : 7:1 pour le texte, 4,5:1 pour le grand texte (24 px, ou 18,66 px en gras), 3:1 pour les composants d'interface.

## 4. Tester avant la démo

1. **Clavier seul** : Tab depuis la barre d'adresse → « Aller au contenu » apparaît. Parcourir : connexion, Missions, Postuler, Tableau de bord (Accepter, Marquer comme terminée, Noter), Notifications. Le focus est toujours visible, rien n'est inatteignable, Échap ferme le menu du compte.
2. **Lecteur d'écran** : Orca (Linux), NVDA (Windows) ou VoiceOver (macOS : Cmd+F5). Vérifier l'annonce « Page : Tableau de bord » au changement de page, la cloche « Notifications, 2 non lues », la note « Note : 4 sur 5 ».
3. **Zoom 200 % puis 400 %** (Ctrl +) : pas de défilement horizontal, rien de coupé (WCAG 1.4.4, 1.4.10).
4. **Préférences du système** : mode sombre, contraste élevé, réduction des animations (Firefox : `about:config` → `ui.prefersReducedMotion` = 1).
5. **Outils automatiques** : extension axe DevTools ou Lighthouse (onglet Accessibilité) sur chaque page.
6. **Validité W3C** : copier le DOM rendu (outils de développement → `<html>` → Copier l'élément externe) dans le validateur HTML du W3C (validator.w3.org/nu, « Validate by direct input »), et `frontend/src/**/*.css` dans le validateur CSS (jigsaw.w3.org/css-validator). Les propriétés récentes (`backdrop-filter`, `:has()`, `forced-colors`) peuvent sortir en avertissement selon la version du validateur.
