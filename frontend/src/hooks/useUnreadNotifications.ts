import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { NOTIFICATIONS_CHANGED_EVENT, notificationsApi } from '../services/api';

// Toutes les 30 s quand l'onglet est visible : assez pour un MVP, sans WebSocket
const POLL_MS = 30_000;

// Nombre de notifications non lues, rafraîchi : à intervalle régulier, au retour sur l'onglet,
// à chaque changement de page et après une action sur la page Notifications
export function useUnreadNotifications(enabled: boolean): number {
    const [count, setCount] = useState(0);
    const { pathname } = useLocation();

    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        const refresh = () => {
            if (document.visibilityState !== 'visible') return;
            notificationsApi
                .unreadCount()
                .then(({ count: n }) => !cancelled && setCount(n))
                .catch(() => {
                    // Panne réseau passagère : on garde le dernier compte connu
                });
        };

        refresh();
        const timer = window.setInterval(refresh, POLL_MS);
        document.addEventListener('visibilitychange', refresh);
        window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
        return () => {
            cancelled = true;
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', refresh);
            window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
        };
    }, [enabled, pathname]);

    return enabled ? count : 0;
}
