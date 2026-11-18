import { Link } from 'react-router-dom'
import { LegalPage, ExternalLink } from '../components/LegalPage'
import { EDITORS, HOST, PUBLICATION_DIRECTOR } from '../constants/legal'

const editorList = `${EDITORS.slice(0, -1).join(', ')} et ${EDITORS[EDITORS.length - 1]}`

export function LegalNoticePage() {
  return (
    <LegalPage
      title="Mentions légales"
      intro="Qui édite HelpUP, qui l’héberge et comment nous joindre."
    >
      <section>
        <h2>Éditeurs du site</h2>
        <p>
          HelpUP est un projet étudiant, édité à titre personnel et non professionnel par {editorList},
          étudiants en Mastère Manager Développeur Full Stack à l’Efrei, dans le cadre du workshop Full Stack
          JavaScript. L’Efrei n’est pas l’éditrice du site.
        </p>
        <p>
          Comme le permet la loi pour la confiance dans l’économie numérique aux éditeurs non professionnels,
          nos adresses personnelles ne sont pas publiées : nos éléments d’identification ont été communiqués à
          l’hébergeur.
        </p>
      </section>

      <section>
        <h2>Directeur de la publication</h2>
        <p>{PUBLICATION_DIRECTOR}, coéditeur du site.</p>
      </section>

      <section>
        <h2>Hébergeur</h2>
        <p>
          Le site est hébergé par {HOST.name}, {HOST.address}. Téléphone : {HOST.phone}. Site :{' '}
          <ExternalLink href={HOST.website}>ovhcloud.com</ExternalLink>. Le serveur se trouve à{' '}
          {HOST.serverLocation}.
        </p>
      </section>

      <section>
        <h2>Nous contacter</h2>
        <p>
          Pour toute question, pour exercer tes droits sur tes données ou pour signaler un contenu, adresse ta
          demande à l’hébergeur, {HOST.name}, aux coordonnées ci-dessus : il dispose de nos coordonnées et peut
          nous la transmettre.
        </p>
      </section>

      <section>
        <h2>Propriété intellectuelle</h2>
        <p>
          Les textes, le code, le logo et la charte graphique de HelpUP appartiennent à ses éditeurs. Les
          annonces, avis, messages et photos publiés par les membres restent leur propriété : ils nous
          autorisent seulement à les afficher sur le site, comme le précisent les{' '}
          <Link to="/conditions">conditions d’utilisation</Link>.
        </p>
        <p>
          Les cartes utilisent les données d’OpenStreetMap, © les contributeurs d’OpenStreetMap, sous licence
          ODbL. Les icônes proviennent de Lucide (licence ISC) et la police Plus Jakarta Sans est publiée sous
          licence SIL Open Font License.
        </p>
      </section>

      <section>
        <h2>Liens vers d’autres sites</h2>
        <p>
          Les liens vers d’autres sites s’ouvrent dans un nouvel onglet. Nous n’exerçons aucun contrôle sur
          leur contenu et n’en assumons pas la responsabilité.
        </p>
      </section>

      <section>
        <h2>Signaler une erreur</h2>
        <p>
          Une information te semble inexacte ? Écris-nous par l’intermédiaire de l’hébergeur : nous corrigeons
          au plus vite.
        </p>
      </section>
    </LegalPage>
  )
}
