import { Link } from 'react-router-dom'
import { LegalPage, ExternalLink } from '../components/LegalPage'
import { DATABASE, EDITORS, EXTERNAL, HOST, LOG_RETENTION } from '../constants/legal'

const editorList = `${EDITORS.slice(0, -1).join(', ')} et ${EDITORS[EDITORS.length - 1]}`

export function PrivacyPage() {
  return (
    <LegalPage
      title="Confidentialité"
      intro="HelpUP a besoin de quelques données pour fonctionner : ton compte, tes missions, tes messages. Nous ne collectons que cela, sans publicité ni pistage, et nous ne revendons rien."
    >
      <section>
        <h2>Responsables du traitement</h2>
        <p>
          Les responsables du traitement sont les éditeurs du site, {editorList}. Pour toute question sur tes
          données, passe par l’hébergeur, {HOST.name} ({HOST.address}, téléphone {HOST.phone}), qui dispose de
          nos coordonnées : voir les <Link to="/mentions-legales">mentions légales</Link>.
        </p>
      </section>

      <section>
        <h2>Les données que nous traitons</h2>
        <h3>Ton compte</h3>
        <ul>
          <li>À l’inscription : ton prénom, ton nom, ton adresse email et ton mot de passe.</li>
          <li>
            Si tu complètes ton profil : ton téléphone, ta ville, ta présentation, tes compétences et
            l’adresse d’une photo.
          </li>
        </ul>
        <p>
          Ton mot de passe n’est jamais enregistré en clair : nous n’en gardons qu’une empreinte chiffrée
          (bcrypt), qui ne permet pas de le retrouver.
        </p>

        <h3>Ton activité sur HelpUP</h3>
        <ul>
          <li>
            Les missions que tu publies : titre, description, catégorie, prime, date et quartier. Nous ne
            demandons jamais ton adresse : la carte place la mission au centre du quartier choisi.
          </li>
          <li>Tes candidatures, les avis que tu donnes et reçois, tes messages privés et tes notifications.</li>
        </ul>

        <h3>Pourquoi</h3>
        <p>
          Ces données servent uniquement à faire fonctionner le service que tu utilises : publier des missions,
          y postuler, échanger avec l’autre membre et vous noter mutuellement. Ce traitement repose sur
          l’exécution des <Link to="/conditions">conditions d’utilisation</Link> que tu acceptes en créant ton
          compte. Nous n’en faisons ni publicité, ni profilage, ni revente.
        </p>
      </section>

      <section>
        <h2>Ce que voient les autres membres</h2>
        <ul>
          <li>
            Ton prénom, l’initiale de ton nom, ta ville, ta photo, ta présentation et tes compétences, ainsi
            que tes missions et les avis que tu as reçus.
          </li>
          <li>
            Ton adresse email et ton téléphone ne sont jamais montrés aux autres membres, ni ton nom de famille
            complet.
          </li>
          <li>
            Tes messages privés ne sont visibles que par les deux personnes concernées par la mission : celle
            qui l’a publiée et celle qui l’a obtenue.
          </li>
        </ul>
        <p>
          Les administrateurs du site peuvent consulter les comptes, y compris l’adresse email, pour modérer
          les contenus et traiter les signalements.
        </p>
      </section>

      <section>
        <h2>Où sont tes données</h2>
        <ul>
          <li>
            La base de données (comptes, missions, candidatures, avis, messages) est hébergée par{' '}
            {DATABASE.provider}, sur son service {DATABASE.service}
            {DATABASE.location ? `, ${DATABASE.location}` : ''}. Ses engagements figurent dans sa{' '}
            <ExternalLink href={EXTERNAL.mongodbPrivacy}>politique de confidentialité</ExternalLink>.
          </li>
          <li>
            Le site est hébergé par {HOST.name} sur un serveur situé à {HOST.serverLocation}, pays dont la
            Commission européenne reconnaît le niveau de protection des données.
          </li>
          <li>
            Cloudflare achemine la connexion entre ton navigateur et le serveur. Il traite à ce titre ton
            adresse IP, le temps de te répondre (
            <ExternalLink href={EXTERNAL.cloudflarePrivacy}>politique de confidentialité de Cloudflare</ExternalLink>
            ).
          </li>
        </ul>
      </section>

      <section>
        <h2>Combien de temps</h2>
        <ul>
          <li>Ton compte et ton profil : tant que ton compte existe.</li>
          <li>Les notifications : 90 jours, puis elles sont effacées automatiquement.</li>
          <li>
            À la suppression de ton compte, nous effaçons ton profil, tes messages, tes notifications et tes
            missions encore ouvertes ; tes candidatures en attente sont retirées. L’historique des missions
            terminées et les avis déjà publiés sont conservés, sans lien vers un profil consultable, pour que
            l’autre membre garde sa propre trace.
          </li>
          <li>
            Les journaux techniques du serveur : dans la limite de {LOG_RETENTION}, les plus anciennes lignes
            étant effacées automatiquement au fur et à mesure.
          </li>
        </ul>
      </section>

      <section>
        <h2>Ni cookie ni traceur</h2>
        <p>
          HelpUP ne dépose aucun cookie et n’utilise aucun outil de mesure d’audience, aucun pixel ni aucun
          script de suivi. Il n’y a donc rien à consentir, et aucune bannière ne t’est présentée.
        </p>
        <p>Ton navigateur garde seulement ce qui est nécessaire au fonctionnement du site :</p>
        <ul>
          <li>ton jeton de connexion, pour que tu restes connecté (il est effacé à la déconnexion) ;</li>
          <li>ton choix de thème clair ou sombre, si tu en as fait un ;</li>
          <li>
            le brouillon d’un formulaire en cours, pour ne pas perdre ta saisie si ta session expire (il est
            effacé à la fermeture de l’onglet).
          </li>
        </ul>
        <p>
          Cloudflare peut, de son côté, employer des cookies strictement nécessaires à la sécurité, par exemple
          une page de vérification quand une connexion lui paraît suspecte. Ils sont dispensés de consentement.
        </p>
      </section>

      <section>
        <h2>Contenus chargés depuis d’autres sites</h2>
        <p>
          La police de caractères est servie depuis notre propre serveur, pas depuis Google Fonts. Deux
          éléments viennent toutefois d’ailleurs, et ces sites reçoivent alors ton adresse IP :
        </p>
        <ul>
          <li>
            les fonds de carte, chargés depuis OpenStreetMap (
            <ExternalLink href={EXTERNAL.osmPrivacy}>politique de confidentialité</ExternalLink>) et{' '}
            <ExternalLink href={EXTERNAL.openFreeMap}>OpenFreeMap</ExternalLink> quand tu consultes une carte ;
          </li>
          <li>
            les photos de profil, que chaque membre indique par une adresse web : elles sont chargées depuis le
            site qui les héberge, sans lui indiquer la page HelpUP d’où vient la demande.
          </li>
        </ul>
      </section>

      <section>
        <h2>Journaux de connexion et sécurité</h2>
        <p>
          Comme tout serveur web, le nôtre enregistre des journaux techniques : adresse IP, date et heure, page
          demandée et navigateur utilisé. L’API note aussi les événements de sécurité (connexions refusées,
          tentatives répétées), avec l’adresse IP mais jamais ton email ni ton mot de passe.
        </p>
        <p>
          Ces journaux servent uniquement à protéger le site contre les attaques et à diagnostiquer les pannes.
          Ils ne sont ni croisés avec d’autres données, ni utilisés pour mesurer l’audience, ni transmis à des
          tiers, sauf demande d’une autorité habilitée. Ce traitement repose sur notre intérêt légitime à
          protéger le site et à le maintenir en état de marche.
        </p>
      </section>

      <section>
        <h2>Âge minimum</h2>
        <p>
          Il faut avoir au moins 16 ans pour créer un compte, comme le précisent les{' '}
          <Link to="/conditions">conditions d’utilisation</Link>.
        </p>
      </section>

      <section>
        <h2>Tes droits</h2>
        <p>
          Tu peux à tout moment accéder à tes données, les rectifier ou les effacer, t’opposer à leur traitement,
          en demander la limitation ou les récupérer dans un format lisible. La plupart de tes informations se
          modifient directement depuis ton profil. Pour le reste, et notamment pour supprimer ton compte,
          adresse ta demande à l’hébergeur, qui nous la transmettra : nous y répondons sous un mois.
        </p>
        <p>
          Si tu estimes que tes droits ne sont pas respectés, tu peux adresser une{' '}
          <ExternalLink href={EXTERNAL.cnil}>réclamation à la CNIL</ExternalLink>.
        </p>
      </section>

      <section>
        <h2>Mise à jour</h2>
        <p>
          Si HelpUP évolue, par exemple avec un paiement en ligne ou un outil de mesure d’audience, cette page
          sera mise à jour avant la mise en ligne de cette évolution.
        </p>
      </section>
    </LegalPage>
  )
}
