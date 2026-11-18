export type NotificationType =
    | 'mission_nearby'
    | 'application_received'
    | 'application_accepted'
    | 'application_rejected'
    | 'mission_completed'
    | 'review_received'
    | 'message_received';

// Notification créée par le serveur ; link = page du front à ouvrir
export interface AppNotification {
    id: string;
    type: NotificationType;
    message: string;
    link: string;
    missionId: string | null;
    read: boolean;
    readAt: string | null;
    createdAt: string;
}

export interface NotificationList {
    items: AppNotification[];
    unreadCount: number;
}
