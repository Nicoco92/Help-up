import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Toutes les 30 s quand l'onglet est visible : assez pour un MVP, sans WebSocket
const POLL_MS = 30_000;

// Compteur rafraîchi (pastilles de la barre de navigation) : à intervalle régulier, au retour sur l'onglet,
// à chaque changement de page et quand l'événement `changedEvent` est émis après une action.
export function usePolledCount(fetchCount: () => Promise<{ count: number }>, changedEvent: string, enabled: boolean): number {
    const [count, setCount] = useState(0);
    const { pathname } = useLocation();

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        const refresh = () => {
            if (document.visibilityState !== 'visible') return;
            fetchCount()
                .then(({ count: n }) => !cancelled && setCount(n))
                .catch(() => {
                    // Panne réseau passagère : on garde le dernier compte connu
                });
        };

        refresh();
        const timer = window.setInterval(refresh, POLL_MS);
        document.addEventListener('visibilitychange', refresh);
        window.addEventListener(changedEvent, refresh);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', refresh);
            window.removeEventListener(changedEvent, refresh);
        };
    }, [enabled, pathname, fetchCount, changedEvent]);

    return enabled ? count : 0;
}
