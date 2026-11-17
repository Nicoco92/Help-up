import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Compass, FileText, MapPin, Undo2 } from 'lucide-react';
import { applicationsApi } from '../services/api';
import type { Application, ApplicationStatus } from '../types/application';
import { Alert } from '../components/Alert';
import { EmptyState } from '../components/States';
import { ApplicationStatusBadge } from '../components/ApplicationStatusBadge';
import { formatAgo, formatDay, formatReward } from '../utils/missionFormat';
import '../styles/applications.css';

type Filter = 'all' | ApplicationStatus;

const FILTERS: Array<{ value: Filter; label: string }> = [
    { value: 'all', label: 'Toutes' },
    { value: 'pending', label: 'En attente' },
    { value: 'accepted', label: 'Acceptées' },
    { value: 'rejected', label: 'Non retenues' }
];

function ApplicationCard({ application, onWithdraw }: { application: Application; onWithdraw: (id: string) => Promise<void> }) {
    const [confirming, setConfirming] = useState(false);
    const [busy, setBusy] = useState(false);
    const { mission } = application;

    const withdraw = async () => {
        setBusy(true);
        try {
            await onWithdraw(application.id);
        } finally {
            setBusy(false);
            setConfirming(false);
        }
    };

    return (
        <article className="card application-card">
            <div className="application-card__head">
                <div>
                    <h3>
                        {/* La page détail n'affiche que les missions encore ouvertes */}
                        {mission && mission.status === 'open' ? (
                            <Link to={`/missions/${mission.id}`}>{mission.title}</Link>
                        ) : (
                            mission?.title ?? 'Mission supprimée'
                        )}
                    </h3>
                    <span className="application-card__ago">Envoyée {formatAgo(application.createdAt)}</span>
                </div>
                <ApplicationStatusBadge status={application.status} />
            </div>

            {mission && (
                <div className="application-card__facts">
                    <span>
                        <MapPin size={16} aria-hidden="true" />
                        {mission.quartierLabel}
                    </span>
                    <span>
                        <CalendarDays size={16} aria-hidden="true" />
                        {formatDay(mission.scheduledAt)}
                    </span>
                    <strong className="application-card__price">{formatReward(mission.rewardCents)}</strong>
                </div>
            )}

            <p className="application-card__message">« {application.message} »</p>

            {application.status === 'accepted' && (
                <Alert variant="success">Bonne nouvelle : la mission vous est attribuée. Retrouvez-la dans votre tableau de bord.</Alert>
            )}

            {application.status === 'pending' && (
                <div className="application-card__actions">
                    {confirming ? (
                        <>
                            <span>Retirer cette candidature ?</span>
                            <button type="button" className="btn btn--secondary btn--sm" onClick={() => setConfirming(false)} disabled={busy}>
                                Annuler
                            </button>
                            <button type="button" className="btn btn--primary btn--sm" onClick={withdraw} disabled={busy}>
                                {busy ? 'Retrait…' : 'Confirmer le retrait'}
                            </button>
                        </>
                    ) : (
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setConfirming(true)}>
                            <Undo2 size={16} aria-hidden="true" />
                            Retirer ma candidature
                        </button>
                    )}
                </div>
            )}
        </article>
    );
}

export function MyApplicationsPage() {
    const [applications, setApplications] = useState<Application[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<Filter>('all');

    useEffect(() => {
        let cancelled = false;
        applicationsApi
            .listMine()
            .then(({ items }) => !cancelled && setApplications(items))
            .catch((err: Error) => !cancelled && setError(err.message));
        return () => {
            cancelled = true;
        };
    }, []);

    const visible = useMemo(
        () => (applications ?? []).filter((a) => filter === 'all' || a.status === filter),
        [applications, filter]
    );

    const withdraw = async (id: string) => {
        try {
            await applicationsApi.remove(id);
            setApplications((current) => current?.filter((a) => a.id !== id) ?? null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'La candidature n’a pas pu être retirée.');
        }
    };

    return (
        <div className="page">
            <div className="container">
                <header className="page-header">
                    <div>
                        <h1>Mes candidatures</h1>
                        <p>Les missions auxquelles vous avez proposé votre aide, et la réponse de leur propriétaire.</p>
                    </div>
                    {applications && (
                        <span className="badge badge--neutral">
                            {applications.length} candidature{applications.length > 1 ? 's' : ''}
                        </span>
                    )}
                </header>

                {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}

                {!applications && !error ? (
                    <div className="application-list" aria-busy="true" aria-label="Chargement des candidatures">
                        {Array.from({ length: 3 }, (_, i) => (
                            <div key={i} className="skeleton" style={{ height: 150 }} />
                        ))}
                    </div>
                ) : applications && applications.length === 0 ? (
                    <EmptyState
                        icon={FileText}
                        title="Aucune candidature pour l’instant"
                        action={
                            <Link to="/missions" className="btn btn--primary">
                                <Compass size={18} aria-hidden="true" />
                                Trouver une mission
                            </Link>
                        }
                    >
                        Parcourez les missions de votre quartier et proposez votre aide.
                    </EmptyState>
                ) : applications ? (
                    <>
                        <div className="segmented" role="tablist" aria-label="Filtrer par statut">
                            {FILTERS.map((f) => (
                                <button
                                    key={f.value}
                                    type="button"
                                    role="tab"
                                    aria-selected={filter === f.value}
                                    className={`segmented__item${filter === f.value ? ' is-active' : ''}`}
                                    onClick={() => setFilter(f.value)}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        {visible.length === 0 ? (
                            <p className="muted">Aucune candidature dans cette catégorie.</p>
                        ) : (
                            <div className="application-list">
                                {visible.map((a) => (
                                    <ApplicationCard key={a.id} application={a} onWithdraw={withdraw} />
                                ))}
                            </div>
                        )}
                    </>
                ) : null}
            </div>
        </div>
    );
}
