import { Link } from 'react-router-dom'
import { LegalPage } from '../components/LegalPage'
import { HOST } from '../constants/legal'

export function TermsPage() {
  return (
    <LegalPage
      title="Conditions d’utilisation"
      intro="Les règles du jeu de HelpUP, pour que l’entraide entre voisins se passe bien. En créant un compte, tu les acceptes."
    >
      <section>
        <h2>Ce qu’est HelpUP</h2>
        <p>
          HelpUP met en relation des particuliers d’un même quartier pour de petits services : tonte,
          déménagement, courses, garde, montage de meubles, soutien scolaire, petit bricolage… Un membre publie
          une mission, d’autres y postulent, il choisit la personne qui la réalisera, puis chacun note l’autre.
        </p>
        <p>
          HelpUP est un projet étudiant, gratuit, réalisé à l’Efrei. Il est fourni tel quel, sans garantie de
          disponibilité, et peut être modifié ou arrêté à tout moment. Les comptes se terminant par
          « @helpup.test » sont des comptes de démonstration fictifs.
        </p>
      </section>

      <section>
        <h2>Ton compte</h2>
        <ul>
          <li>Il faut avoir au moins 16 ans pour créer un compte.</li>
          <li>Tes informations doivent être exactes, et un compte correspond à une seule personne.</li>
          <li>
            Ton mot de passe est personnel : ne le communique à personne. Tout ce qui est fait depuis ton
            compte est réputé fait par toi.
          </li>
        </ul>
      </section>

      <section>
        <h2>Le rôle de HelpUP</h2>
        <p>HelpUP est un simple intermédiaire qui permet aux membres de se rencontrer. En particulier :</p>
        <ul>
          <li>
            HelpUP n’est pas partie à l’accord conclu entre deux membres et n’emploie pas les personnes qui
            réalisent les missions ;
          </li>
          <li>
            HelpUP ne vérifie ni l’identité, ni les compétences, ni les assurances des membres : à chacun de
            s’assurer que l’autre lui convient, en s’aidant des profils et des avis ;
          </li>
          <li>
            aucun paiement ne passe par HelpUP : la prime affichée est celle proposée par l’auteur de la
            mission, et son versement se règle directement entre les deux membres.
          </li>
        </ul>
      </section>

      <section>
        <h2>Tes engagements</h2>
        <p>En utilisant HelpUP, tu t’engages à :</p>
        <ul>
          <li>
            respecter la loi, notamment les règles qui encadrent le travail des mineurs et la déclaration de tes
            revenus quand elle est due ;
          </li>
          <li>
            ne publier que des missions licites, sans danger et qui ne demandent pas une qualification
            réglementée (soins, électricité, gaz…) ;
          </li>
          <li>
            rester courtois, et ne publier aucun contenu injurieux, discriminatoire, haineux, trompeur ou
            publicitaire, ni les coordonnées d’une autre personne sans son accord ;
          </li>
          <li>
            ne laisser que des avis sincères, sur une mission réellement réalisée avec le membre concerné ;
          </li>
          <li>
            ne pas détourner le service : pas de faux compte, pas de collecte des profils, pas d’atteinte à la
            sécurité du site.
          </li>
        </ul>
        <p>Une assurance responsabilité civile est vivement recommandée à toutes les personnes qui rendent service.</p>
      </section>

      <section>
        <h2>Les contenus que tu publies</h2>
        <p>
          Tes missions, avis, messages et photo restent ta propriété. Tu nous autorises seulement à les afficher
          sur HelpUP, gratuitement et le temps de leur publication. Tu es responsable de ce que tu publies, et tu
          garantis avoir le droit de le faire, notamment pour les photos.
        </p>
        <p>
          La messagerie privée s’ouvre quand une mission est attribuée, entre la personne qui l’a publiée et
          celle qui la réalise. Ce que tu y écris n’est visible que par vous deux.
        </p>
      </section>

      <section>
        <h2>Modération et signalement</h2>
        <p>
          Les administrateurs de HelpUP peuvent masquer ou supprimer une mission, et suspendre ou supprimer un
          compte, en cas de manquement à ces conditions ou de contenu illicite.
        </p>
        <p>
          Pour signaler un contenu ou un comportement, adresse-toi à l’hébergeur, {HOST.name} ({HOST.address},
          téléphone {HOST.phone}), qui nous transmettra ton signalement. Indique la page concernée et ce qui te
          paraît poser problème.
        </p>
      </section>

      <section>
        <h2>Responsabilité</h2>
        <p>
          Chaque membre est seul responsable des missions qu’il propose ou réalise, et des engagements qu’il
          prend envers un autre membre. HelpUP ne peut être tenu responsable de la bonne exécution d’une
          mission, d’un dommage survenu à cette occasion, ni d’un litige entre membres. Nous faisons de notre
          mieux pour que le site fonctionne, sans pouvoir garantir qu’il soit toujours disponible ou exempt
          d’erreurs.
        </p>
      </section>

      <section>
        <h2>Supprimer ton compte</h2>
        <p>
          Tu peux demander la suppression de ton compte à tout moment, par l’intermédiaire de l’hébergeur. Ce
          qui est alors effacé, et ce qui est conservé, est décrit dans la page{' '}
          <Link to="/confidentialite">Confidentialité</Link>. Une suppression n’est pas possible tant que tu as
          une mission en cours, attribuée mais pas encore terminée.
        </p>
      </section>

      <section>
        <h2>Évolution de ces conditions</h2>
        <p>
          Ces conditions peuvent évoluer avec le service. La date de mise à jour figure en haut de la page ; en
          cas de changement important, les membres en sont informés sur le site.
        </p>
      </section>

      <section>
        <h2>Droit applicable</h2>
        <p>Ces conditions sont soumises au droit français.</p>
      </section>
    </LegalPage>
  )
}
