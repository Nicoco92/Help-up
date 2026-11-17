import type { ApplicationStatus } from '../types/application';

const labels: Record<ApplicationStatus, string> = {
    pending: 'En attente',
    accepted: 'Acceptée',
    rejected: 'Non retenue',
    withdrawn: 'Retirée'
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
    return <span className={`application-badge application-badge--${status}`}>{labels[status]}</span>;
}
