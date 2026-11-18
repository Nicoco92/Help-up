import { MESSAGES_CHANGED_EVENT, messagesApi } from '../services/api';
import { usePolledCount } from './usePolledCount';

// Nombre de messages privés reçus et pas encore lus (pastille « Messages »)
export function useUnreadMessages(enabled: boolean): number {
    return usePolledCount(messagesApi.unreadCount, MESSAGES_CHANGED_EVENT, enabled);
}
