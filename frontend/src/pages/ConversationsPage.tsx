import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { messagesApi } from '../services/api';
import type { Conversation } from '../types/message';
import { Alert } from '../components/Alert';
import { Avatar } from '../components/Avatar';
import { EmptyState } from '../components/States';
import { StatusBadge } from '../components/StatusBadge';
import { formatWhen, fullName } from '../utils/format';
import '../styles/applications.css';
import '../styles/notifications.css';
import '../styles/messages.css';

// Même rythme que la pastille : la liste se met à jour toute seule quand un message arrive
const POLL_MS = 30_000;

function ConversationItem({ conversation }: { conversation: Conversation }) {
    const { counterpart, lastMessage, unreadCount, mission } = conversation;
    const name = counterpart ? fullName(counterpart) : 'Membre supprimé';
    const preview = lastMessage
        ? `${lastMessage.mine ? 'Vous : ' : ''}${lastMessage.body}`
        : conversation.canWrite
          ? `Écrivez à ${counterpart?.firstName ?? 'l’autre participant'} pour organiser la mission.`
          : 'Aucun message échangé.';

    return (
        <li>
            <Link
                to={`/messages/${conversation.id}`}
                className={`conversation-item${unreadCount > 0 ? ' conversation-item--unread' : ''}`}
            >
                {counterpart ? <Avatar {...counterpart} size={44} /> : <Avatar firstName="?" lastName="" size={44} />}
                <div className="conversation-item__body">
                    <div className="conversation-item__top">
                        <strong>{name}</strong>
                        {lastMessage && <time dateTime={lastMessage.createdAt}>{formatWhen(lastMessage.createdAt)}</time>}
                    </div>
                    <span className="conversation-item__mission">
                        {conversation.role === 'owner' ? 'Votre mission' : 'Mission'} « {mission.title} »
                    </span>
                    <span className="conversation-item__preview">{preview}</span>
                    <div className="conversation-item__meta">
                        <StatusBadge status={mission.status} />
                        {/* L'état « non lu » est donné en texte, pas seulement par la couleur */}
                        {unreadCount > 0 && (
                            <span className="notification__new">
                                {unreadCount} nouveau{unreadCount > 1 ? 'x' : ''}
                            </span>
                        )}
                    </div>
                </div>
            </Link>
        </li>
    );
}

export function ConversationsPage() {
    const [items, setItems] = useState<Conversation[] | null>(null);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(() => {
        if (document.visibilityState !== 'visible') return;
        messagesApi
            .conversations()
            .then(({ items: list }) => {
                setItems(list);
                setError(null);
            })
            .catch((err: Error) => setError(err.message));
    }, []);

    useEffect(() => {
        load();
        const timer = window.setInterval(load, POLL_MS);
        document.addEventListener('visibilitychange', load);
        return () => {
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', load);
        };
    }, [load]);

    const unread = items?.reduce((sum, c) => sum + c.unreadCount, 0) ?? 0;

    return (
        <div className="page">
            <div className="container">
                <header className="page-header">
                    <div>
                        <h1>Messages</h1>
                        <p>
                            {unread === 0
                                ? 'Échangez avec vos clients et prestataires une fois la candidature acceptée.'
                                : `${unread} message${unread > 1 ? 's' : ''} non lu${unread > 1 ? 's' : ''}.`}
                        </p>
                    </div>
                </header>

                {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}

                {!items && !error && (
                    <div className="application-list" aria-busy="true" aria-label="Chargement des conversations">
                        <div className="skeleton" style={{ height: 88 }} />
                        <div className="skeleton" style={{ height: 88 }} />
                    </div>
                )}

                {items && items.length === 0 && (
                    <EmptyState
                        icon={MessageCircle}
                        title="Aucune conversation"
                        action={
                            <Link to="/missions" className="btn btn--primary">
                                Trouver une mission
                            </Link>
                        }
                    >
                        Une conversation s’ouvre quand un client accepte une candidature : le client et le prestataire
                        peuvent alors s’écrire pour organiser la mission.
                    </EmptyState>
                )}

                {items && items.length > 0 && (
                    <ul className="card conversation-list">
                        {items.map((c) => (
                            <ConversationItem key={c.id} conversation={c} />
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
