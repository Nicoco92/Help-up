# Sécurité — audit et mesures (HelpUP)

> Audit de bout en bout du 17 novembre 2026 : API Express, front React, base MongoDB, Docker, dépendances.
> Méthode : OWASP Top 10 (2021) et OWASP ASVS 4, en suivant trois référentiels publics d'agents de revue de sécurité :
> `getsentry/skills › security-review` (revue fondée sur les OWASP Cheat Sheets, uniquement les failles réellement exploitables),
> `addyosmani/agent-skills › security-and-hardening` (checklist de durcissement) et `openai/skills › security-threat-model`.
> Chaque correction est vérifiée par un test qui rejoue l'attaque : `backend/tests/security.test.ts` (24 tests).

## 1. Modèle de menace

| Élément | Contenu |
|---|---|
| **Données à protéger** | Comptes (email, mot de passe), jeton de session (JWT), données personnelles (téléphone, ville, biographie), réputation (avis), intégrité des missions et des candidatures |
| **Attaquants** | Visiteur anonyme sur Internet ; membre malveillant (lire ou modifier les données d'un autre, devenir admin, fausser les avis) ; script automatisé (force brute, création de comptes en masse) ; dépendance npm compromise |
| **Frontières de confiance** | Navigateur → API (tout ce qui arrive est hostile) ; API → MongoDB (compte limité à `readWrite` sur `helpup`) ; npm → code (dépendances) |
| **Choix « sécurité dès la conception » déjà en place** | Pas d'adresse exacte : une mission n'a qu'un **quartier**, les coordonnées sont calculées par le serveur. Profil public réduit (prénom, initiale du nom, ville). `ownerId`, `authorId`, `targetId`, `status` toujours fixés par le serveur. Un seul type de compte public, le rôle admin n'est jamais attribuable par l'API publique |

## 2. Constats et corrections

Gravité : **Haute** = exploitable sans compte ou avec un compte ordinaire ; **Moyenne** = exploitable sous conditions ; **Basse** = durcissement.

| # | OWASP | Constat (avant) | Gravité | Correction | Test |
|---|---|---|---|---|---|
| 1 | A07 | Aucune limite de tentatives : force brute des mots de passe et création de comptes en masse | **Haute** | `express-rate-limit` : connexion 10 échecs / 15 min / IP (les connexions réussies ne comptent pas, la démo n'est jamais bloquée), inscription 20 / h, API 300 / min ; réponse `429 TOO_MANY_REQUESTS` + `Retry-After` | ✅ |
| 2 | A05 | API et front de développement publiés sur **toutes** les interfaces réseau (`3000:3000`, `5173:5173`) : accessibles depuis le Wi-Fi de l'école | **Haute** | Ports liés à `127.0.0.1` dans `compose.yaml`, comme Mongo et mongo-express | — |
| 3 | A02 | `JWT_SECRET` accepté quelle que soit sa longueur (`change-me` du modèle compris) : jeton forgeable par force brute hors ligne | **Moyenne** | 32 caractères minimum et liste de secrets interdits : refus de démarrer en production, avertissement en développement | — |
| 4 | A07 | Jeton sans émetteur ni destinataire ; durée par défaut de **7 jours** si `JWT_EXPIRES_IN` manque | Moyenne | Claims `iss` et `aud` signés et vérifiés, algorithme `HS256` imposé, sujet obligatoirement un ObjectId, durée par défaut **1 h** | ✅ (8 jetons falsifiés → 401) |
| 5 | A02 | Mot de passe limité à 72 **caractères** : avec des accents, au-delà de 72 **octets**, bcrypt tronquait en silence | Moyenne | Limite en octets UTF-8 (`TextEncoder`) | ✅ |
| 6 | A02 | Coût bcrypt de 10 | Basse | Coût **12** ; les anciens hachages (comptes de démo compris) sont refaits à la connexion suivante ; hachage factice au même coût pour garder un temps de réponse identique (pas d'énumération des comptes) | ✅ (même réponse pour email inconnu ou mot de passe faux) |
| 7 | A05 | Corps de plus de 100 ko → **500** « erreur interne » (et trace dans les logs) | Basse | `413 PAYLOAD_TOO_LARGE` au format commun ; autres erreurs de lecture du corps → 4xx | ✅ |
| 8 | A04 | Réponses avec données personnelles et jeton sans directive de cache | Basse | `Cache-Control: no-store` sur toutes les routes métier | ✅ |
| 9 | A04 | `GET /api/users` renvoyait **tous** les comptes en une fois | Basse | 200 au plus (déni de service, aspiration des profils) | — |
| 10 | A09 | Aucun journal de sécurité | Moyenne | `securityLog` : une ligne JSON par échec de connexion, jeton rejeté (hors simple expiration), accès admin refusé, quota dépassé ; IP et route, **jamais** d'email, de mot de passe ou de jeton | — |
| 11 | A03 / A07 | Le JWT est dans le `localStorage` (choix du MVP) : une faille XSS suffirait à le voler | Moyenne | **Content-Security-Policy** stricte sur le build de production (`script-src 'self'`, `connect-src` limité à l'API et aux tuiles, `frame-ancestors 'none'`, `object-src 'none'`) + `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`, `nosniff`, `COOP` (`vite.config.ts`) | Vérifié : le build s'affiche sous CSP (Firefox) |
| 12 | A01 | Avatar = n'importe quelle URL `https` : le site hébergeant l'image apprend quelle page de HelpUP est consultée | Basse | `referrerPolicy="no-referrer"` sur les avatars | — |
| 13 | A05 | CORS : une seule origine, méthodes non restreintes | Basse | Liste d'origines (`CORS_ORIGIN` séparées par des virgules), méthodes `GET POST PATCH DELETE`, `maxAge` | ✅ |
| 14 | A05 | Proxy : `X-Forwarded-For` jamais lu, ce qui fausserait la limitation de débit derrière un reverse proxy | Basse | `TRUST_PROXY` (vide en local = en-tête ignoré, donc non falsifiable) | — |
| 15 | A06 | 24 alertes « modérées » dans les outils de développement (jest, typescript-eslint, minimatch) | Basse | `npm audit fix` : **0** dans le front ; 18 restantes côté back, uniquement dans jest (la correction impose de changer de version majeure) ; **0 dans les dépendances de production** des deux côtés | `npm audit --omit=dev` |
| 16 | A08 | Pas de veille sur les dépendances | Basse | `.github/dependabot.yml` (hebdomadaire, délai de 7 jours avant de proposer une nouvelle version) ; `express-rate-limit` épinglé sur une version publiée depuis plus de deux semaines | — |

## 3. Ce qui était déjà solide (vérifié, rien à changer)

| OWASP | Contrôle | Où |
|---|---|---|
| A01 | Chaque requête métier filtre par propriétaire (`ownerId`, `applicantId`, `authorId`, `userId` = JWT) ; l'objet d'un autre = **404** comme un objet absent | services `application`, `mission`, `review`, `notification` |
| A01 | Routes d'administration derrière `requireRole('admin')` ; impossible de se donner le rôle admin (inscription et `PATCH /me` en `strict`) ; un admin ne peut pas modifier son propre rôle | `user.routes.ts`, `user.service.ts` |
| A01 | Utilisateur rechargé en base à chaque requête : compte supprimé ou rôle retiré = pris en compte immédiatement | `auth.middleware.ts` |
| A03 | Validation zod **stricte** de chaque corps et de chaque paramètre (champ inconnu → 400) : aucun opérateur `$ne`/`$gt` ne peut atteindre MongoDB | `validators/*.ts` ; test « injection NoSQL » ✅ |
| A03 | Recherche texte : caractères spéciaux d'expression régulière échappés, 80 caractères au plus (pas de ReDoS) | `explore.service.ts` ; test ✅ |
| A03 | React échappe tout l'affichage ; aucun `dangerouslySetInnerHTML` ; le seul HTML construit à la main (marqueur Leaflet) ne contient qu'un nombre | `MissionMap.tsx` |
| A03 | Paramètres d'URL toujours des chaînes (parseur « simple » d'Express 5, désormais explicite) | `app.ts` ; test ✅ |
| A04 | Logique métier : on ne postule pas à sa mission, on ne note qu'une mission terminée et que l'autre participant, une seule acceptation possible même en simultané (`findOneAndUpdate` conditionnel), index uniques contre les doublons | services |
| A05 | `helmet` (CSP de l'API, HSTS, `nosniff`, `X-Powered-By` retiré) ; JSON limité à 100 ko ; erreurs 500 sans détail technique | `app.ts`, `error.middleware.ts` |
| A07 | Mêmes code et message pour un email inconnu et un mauvais mot de passe | `auth.service.ts` ; test ✅ |
| A02 | Hachage bcrypt, `passwordHash` jamais sélectionné ni renvoyé | `user.model.ts` ; test ✅ |
| — | Pas de cookie de session : **CSRF impossible** (le jeton part dans l'en-tête `Authorization`, qu'un autre site ne peut pas ajouter) | `services/api.ts` |
| — | Secrets : un seul `.env` non versionné, `.env.example` sans valeur réelle, rien de secret préfixé `VITE_` ; le backend ne reçoit jamais le mot de passe root de Mongo | `compose.yaml` |

## 4. Risques acceptés et recommandations pour une mise en production

| Sujet | Pourquoi c'est accepté pour le MVP | À faire en production |
|---|---|---|
| JWT dans le `localStorage` | Simple, sans CSRF ; la CSP limite fortement le risque XSS | Cookie `HttpOnly; Secure; SameSite=Strict` posé par l'API + jeton anti-CSRF |
| Pas de révocation de jeton | Durée de 1 h ; compte supprimé = jeton refusé | Jeton court (15 min) + jeton de rafraîchissement révocable |
| `409 EMAIL_ALREADY_USED` révèle qu'un email est inscrit | Imposé par le contrat du livret | Limitation de débit (faite) ; à terme, inscription par lien envoyé par email |
| Suppression de compte (`DELETE /api/users/me`) sans redemander le mot de passe | Le front ne propose pas encore cette action | Exiger le mot de passe dans le corps de la requête avant de supprimer |
| Pas de vérification d'email ni de double authentification | Hors périmètre du MVP | Vérification d'email, double authentification pour les admins |
| Conteneurs de développement lancés en root, `npm install` | Environnement local uniquement | Image de production : `npm ci --omit=dev`, utilisateur `node`, système de fichiers en lecture seule |
| Avatars hébergés ailleurs | Pas de stockage de fichiers dans le MVP | Envoi de fichier vers le serveur, contrôle du type et redimensionnement |
| Swagger public sur `/api/docs` | Exigé par le livret pour la démo | Le désactiver ou le protéger en production |
| 18 alertes modérées dans jest | Outil de test, jamais déployé | Mettre jest à jour quand la version majeure corrigée sera stable (Dependabot la proposera) |

Déploiement : HTTPS obligatoire (HSTS déjà envoyé), `NODE_ENV=production`, `TRUST_PROXY=1` derrière un reverse proxy, en-têtes de `vite.config.ts › preview` recopiés dans le serveur web, port Mongo fermé, mongo-express non déployé, liste d'IP autorisées et compte `readWrite` limité sur Atlas, secrets régénérés (`openssl rand -hex 32`).

## 5. Vérifier soi-même

```bash
# Tests d'attaque (jetons falsifiés, injections, élévation de privilèges, force brute…)
cd backend && npm test -- security

# Vulnérabilités connues des dépendances livrées
npm audit --omit=dev && (cd ../frontend && npm audit --omit=dev)

# En-têtes du front de production
cd ../frontend && npm run build && npx vite preview   # puis : curl -I http://localhost:4173

# Secrets éventuellement commités dans l'historique (outil gitleaks, image Docker officielle)
cd .. && docker run --rm -v "$PWD:/repo" zricethezav/gitleaks:latest git /repo
```
