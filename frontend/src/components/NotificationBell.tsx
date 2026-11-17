import { NavLink } from 'react-router-dom';
import { Bell } from 'lucide-react';
import { useUnreadNotifications } from '../hooks/useUnreadNotifications';
import '../styles/notifications.css';

// Cloche de la barre de navigation, avec le nombre de notifications non lues
// La pastille est orange (signal « nouveau » de la charte) avec un texte Charcoal (7,23:1)
export function NotificationBell() {
    const count = useUnreadNotifications(true);
    const label = count === 0 ? 'Notifications' : `Notifications, ${count} non lue${count > 1 ? 's' : ''}`;

    return (
        <NavLink
            to="/notifications"
            className={({ isActive }) => `notification-bell${isActive ? ' active' : ''}`}
            aria-label={label}
        >
            <Bell size={22} aria-hidden="true" />
            {count > 0 && (
                <span className="notification-bell__count" aria-hidden="true">
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </NavLink>
    );
}
