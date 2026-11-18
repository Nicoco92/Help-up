import { NavLink } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import '../styles/notifications.css';

export function NotificationBell({ onNavigate }: { onNavigate: () => void }) {
    const count = useUnreadNotifications(true);
    const label = count === 0 ? 'Notifications' : `Notifications, ${count} non lue${count > 1 ? 's' : ''}`;

    return (
        <NavLink
            to="/notifications"
            className={({ isActive }) => `navbar__link notification-bell${isActive ? ' active' : ''}`}
            aria-label={label}
            title="Notifications"
            onClick={onNavigate}
        >
            <Bell size={18} aria-hidden="true" />
            <span>Notifications</span>
            {count > 0 && (
                <span className="notification-bell__count" aria-hidden="true">
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </NavLink>
    );
}
