import { NOTIFICATIONS_CHANGED_EVENT, notificationsApi } from '../services/api';
import { usePolledCount } from './usePolledCount';

// Nombre de notifications non lues (pastille de la cloche)
export function useUnreadNotifications(enabled: boolean): number {
    return usePolledCount(notificationsApi.unreadCount, NOTIFICATIONS_CHANGED_EVENT, enabled);
}
