import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Bell,
    BellOff,
    CheckCheck,
    CheckCircle2,
    FileText,
    MapPin,
    Star,
    Trash2,
    XCircle,
    type LucideIcon
} from 'lucide-react';
import { NOTIFICATIONS_CHANGED_EVENT, notificationsApi } from '../services/api';
import type { AppNotification, NotificationList, NotificationType } from '../types/notification';
import { Alert } from '../components/Alert';
import { EmptyState } from '../components/States';
import '../styles/applications.css';
import '../styles/notifications.css';

const ICONS: Record<NotificationType, LucideIcon> = {
    mission_nearby: MapPin,
    application_received: FileText,
    application_accepted: CheckCircle2,
    application_rejected: XCircle,
    mission_completed: CheckCheck,
    review_received: Star
};

// Date ISO → « il y a 5 min », « il y a 2 h », « hier », « 12 nov. »
const formatWhen = (iso: string): string => {
    const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
    if (minutes < 1) return 'à l’instant';
    if (minutes < 60) return `il y a ${minutes} min`;
    if (minutes < 24 * 60) return `il y a ${Math.floor(minutes / 60)} h`;
    if (minutes < 48 * 60) return 'hier';
    return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
};

const changed = () => window.dispatchEvent(new Event(NOTIFICATIONS_CHANGED_EVENT));

function NotificationRow({
    notification,
    onOpen,
    onToggle,
    onRemove
}: {
    notification: AppNotification;
    onOpen: () => void;
    onToggle: () => void;
    onRemove: () => void;
}) {
    const Icon = ICONS[notification.type] ?? Bell;
    return (
        <li className={`notification${notification.read ? '' : ' notification--unread'}`}>
            <span className="notification__icon" aria-hidden="true">
                <Icon size={20} />
            </span>
            <div className="notification__body">
                {/* L'état « non lue » est donné en texte, pas seulement par la couleur */}
                {!notification.read && <span className="notification__new">Nouveau</span>}
                <button type="button" className="notification__message" onClick={onOpen}>
                    {notification.message}
                </button>
                <time dateTime={notification.createdAt}>{formatWhen(notification.createdAt)}</time>
            </div>
            <div className="notification__actions">
                <button type="button" className="btn btn--ghost btn--sm" onClick={onToggle}>
                    {notification.read ? 'Marquer non lue' : 'Marquer lue'}
                </button>
                <button type="button" className="btn btn--ghost btn--icon" onClick={onRemove} aria-label="Supprimer la notification">
                    <Trash2 size={18} aria-hidden="true" />
                </button>
            </div>
        </li>
    );
}

export function NotificationsPage() {
    const navigate = useNavigate();
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [data, setData] = useState<NotificationList | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [status, setStatus] = useState('');

    const load = useCallback(() => {
        notificationsApi
            .list(unreadOnly)
            .then((result) => {
                setData(result);
                setError(null);
            })
            .catch((err: Error) => setError(err.message));
    }, [unreadOnly]);

    useEffect(load, [load]);

    // Chaque action recharge la liste et la pastille, et annonce son résultat aux lecteurs d'écran
    const run = async (action: () => Promise<unknown>, message: string) => {
        try {
            await action();
            setStatus(message);
            load();
            changed();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'L’action n’a pas pu être effectuée.');
        }
    };

    const open = async (notification: AppNotification) => {
        if (!notification.read) {
            await notificationsApi.markRead(notification.id, true).catch(() => undefined);
            changed();
        }
        navigate(notification.link);
    };

    const unreadCount = data?.unreadCount ?? 0;

    return (
        <div className="page page--narrow">
            <div className="container">
                <header className="page-header">
                    <div>
                        <h1>Notifications</h1>
                        <p>
                            {unreadCount === 0
                                ? 'Vous êtes à jour.'
                                : `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}.`}
                        </p>
                    </div>
                    {unreadCount > 0 && (
                        <button
                            type="button"
                            className="btn btn--secondary"
                            onClick={() => run(notificationsApi.markAllRead, 'Toutes les notifications sont marquées comme lues.')}
                        >
                            <CheckCheck size={18} aria-hidden="true" />
                            Tout marquer comme lu
                        </button>
                    )}
                </header>

                <div className="segmented" role="group" aria-label="Afficher">
                    <button
                        type="button"
                        className={`segmented__item${!unreadOnly ? ' is-active' : ''}`}
                        aria-pressed={!unreadOnly}
                        onClick={() => setUnreadOnly(false)}
                    >
                        Toutes
                    </button>
                    <button
                        type="button"
                        className={`segmented__item${unreadOnly ? ' is-active' : ''}`}
                        aria-pressed={unreadOnly}
                        onClick={() => setUnreadOnly(true)}
                    >
                        Non lues
                    </button>
                </div>

                <p className="visually-hidden" role="status">
                    {status}
                </p>
                {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}

                {!data && !error && (
                    <div className="application-list" aria-busy="true" aria-label="Chargement des notifications">
                        <div className="skeleton" style={{ height: 72 }} />
                        <div className="skeleton" style={{ height: 72 }} />
                    </div>
                )}

                {data && data.items.length === 0 && (
                    <EmptyState icon={BellOff} title={unreadOnly ? 'Aucune notification non lue' : 'Aucune notification'}>
                        Vous serez prévenu ici quand quelqu’un postule à vos missions, quand on vous répond ou quand une
                        mission est publiée près de chez vous.
                    </EmptyState>
                )}

                {data && data.items.length > 0 && (
                    <ul className="card notification-list">
                        {data.items.map((n) => (
                            <NotificationRow
                                key={n.id}
                                notification={n}
                                onOpen={() => open(n)}
                                onToggle={() =>
                                    run(
                                        () => notificationsApi.markRead(n.id, !n.read),
                                        n.read ? 'Notification marquée comme non lue.' : 'Notification marquée comme lue.'
                                    )
                                }
                                onRemove={() => run(() => notificationsApi.remove(n.id), 'Notification supprimée.')}
                            />
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
