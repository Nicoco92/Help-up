import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Titre de chaque page (WCAG 2.4.2, RGAA 8.6) : « Tableau de bord · HelpUP »
const TITLES: [RegExp, string][] = [
    [/^\/$/, 'Mini-jobs entre voisins'],
    [/^\/login$/, 'Connexion'],
    [/^\/register$/, 'Créer un compte'],
    [/^\/mentions-legales$/, 'Mentions légales'],
    [/^\/confidentialite$/, 'Confidentialité'],
    [/^\/conditions$/, 'Conditions d’utilisation'],
    [/^\/missions$/, 'Missions près de chez vous'],
    [/^\/missions\/[^/]+$/, 'Détail d’une mission'],
    [/^\/applications$/, 'Mes candidatures'],
    [/^\/dashboard$/, 'Tableau de bord'],
    [/^\/notifications$/, 'Notifications'],
    [/^\/messages$/, 'Messages'],
    [/^\/messages\/[^/]+$/, 'Conversation'],
    [/^\/profile$/, 'Mon profil'],
    [/^\/users$/, 'Membres'],
    [/^\/users\/[^/]+$/, 'Profil d’un membre'],
    [/^\/admin$/, 'Administration']
];

const pageTitle = (pathname: string): string =>
    TITLES.find(([pattern]) => pattern.test(pathname))?.[1] ?? 'Page introuvable';

// Navigation d'une application monopage, rendue accessible :
// - met à jour le titre de l'onglet ;
// - place le focus sur le titre principal de la nouvelle page (sinon il reste sur le lien cliqué) ;
// - annonce la page aux lecteurs d'écran.
// Au premier affichage on ne déplace pas le focus : le navigateur s'en charge.
export function RouteAnnouncer() {
    const { pathname } = useLocation();
    const [announcement, setAnnouncement] = useState('');
    const firstRender = useRef(true);

    useEffect(() => {
        const title = pageTitle(pathname);
        document.title = `${title} · HelpUP`;

        if (firstRender.current) {
            firstRender.current = false;
            return;
        }

        // On attend le rendu de la page (les données peuvent arriver un peu après le titre)
        const frame = window.requestAnimationFrame(() => {
            const heading = document.querySelector<HTMLElement>('main h1') ?? document.getElementById('contenu');
            if (heading) {
                if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
                heading.focus({ preventScroll: false });
            }
            setAnnouncement(`Page : ${title}`);
        });
        return () => window.cancelAnimationFrame(frame);
    }, [pathname]);

    return (
        <p className="visually-hidden" aria-live="polite" aria-atomic="true">
            {announcement}
        </p>
    );
}
