import { useEffect, useState } from 'react';
import { Check, MapPin, X } from 'lucide-react';
import { applicationsApi } from '../services/api';
import type { Application } from '../types/application';
import { Avatar } from './Avatar';
import { Alert } from './Alert';
import { SkillList } from './Skills';
import { Spinner } from './States';
import { ApplicationStatusBadge } from './ApplicationStatusBadge';
import { formatAgo } from '../utils/missionFormat';

interface CandidatesPanelProps {
    missionId: string;
    // Les boutons Accepter / Refuser n'apparaissent que si la mission est encore ouverte
    canDecide: boolean;
    // Appelé après une décision, pour recharger le tableau de bord
    onDecision: () => void;
}

// Candidats d'une de mes missions, avec Accepter / Refuser
export function CandidatesPanel({ missionId, canDecide, onDecision }: CandidatesPanelProps) {
    const [candidates, setCandidates] = useState<Application[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [confirmAccept, setConfirmAccept] = useState<string | null>(null);
    const [busy, setBusy] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        applicationsApi
            .listForMission(missionId)
            .then(({ items }) => !cancelled && setCandidates(items))
            .catch((err: Error) => !cancelled && setError(err.message));
        return () => {
            cancelled = true;
        };
    }, [missionId]);

    const decide = async (applicationId: string, decision: 'accept' | 'reject') => {
        setBusy(applicationId);
        setError(null);
        try {
            await applicationsApi[decision](missionId, applicationId);
            onDecision();
            if (decision === 'reject') {
                setCandidates((current) =>
                    current?.map((c) => (c.id === applicationId ? { ...c, status: 'rejected' } : c)) ?? null
                );
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'La décision n’a pas pu être enregistrée.');
        } finally {
            setBusy(null);
            setConfirmAccept(null);
        }
    };

    if (error) {
        return <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>;
    }
    if (!candidates) {
        return (
            <div className="candidates candidates--loading">
                <Spinner label="Chargement des candidats" />
            </div>
        );
    }
    if (candidates.length === 0) {
        return <p className="candidates muted">Aucune candidature pour le moment.</p>;
    }

    return (
        <ul className="candidates">
            {candidates.map((c) => (
                <li key={c.id} className="candidate">
                    <div className="candidate__head">
                        {c.applicant && <Avatar {...c.applicant} size={40} />}
                        <div className="candidate__who">
                            <strong>
                                {c.applicant ? `${c.applicant.firstName} ${c.applicant.lastName}` : 'Membre supprimé'}
                            </strong>
                            <span>
                                {c.applicant?.city && (
                                    <>
                                        <MapPin size={14} aria-hidden="true" />
                                        {c.applicant.city} ·{' '}
                                    </>
                                )}
                                {formatAgo(c.createdAt)}
                            </span>
                        </div>
                        <ApplicationStatusBadge status={c.status} />
                    </div>

                    <p className="candidate__message">« {c.message} »</p>
                    {c.applicant && <SkillList skills={c.applicant.skills} />}

                    {canDecide && c.status === 'pending' && (
                        <div className="candidate__actions">
                            {confirmAccept === c.id ? (
                                <>
                                    <span>Confier la mission à {c.applicant?.firstName ?? 'ce membre'} ? Les autres candidatures seront refusées.</span>
                                    <button type="button" className="btn btn--secondary btn--sm" onClick={() => setConfirmAccept(null)} disabled={busy !== null}>
                                        Annuler
                                    </button>
                                    <button type="button" className="btn btn--primary btn--sm" onClick={() => decide(c.id, 'accept')} disabled={busy !== null}>
                                        {busy === c.id ? 'Envoi…' : 'Confirmer'}
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button type="button" className="btn btn--primary btn--sm" onClick={() => setConfirmAccept(c.id)} disabled={busy !== null}>
                                        <Check size={16} aria-hidden="true" />
                                        Accepter
                                    </button>
                                    <button type="button" className="btn btn--ghost btn--sm" onClick={() => decide(c.id, 'reject')} disabled={busy !== null}>
                                        <X size={16} aria-hidden="true" />
                                        {busy === c.id ? 'Envoi…' : 'Refuser'}
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );
}
