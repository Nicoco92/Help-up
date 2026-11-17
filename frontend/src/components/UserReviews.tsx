import { useEffect, useState } from 'react';
import { MessageSquareQuote, Star } from 'lucide-react';
import { reviewsApi } from '../services/api';
import type { UserReviews as UserReviewsData } from '../types/review';
import { Avatar } from './Avatar';
import { Alert } from './Alert';
import { Spinner } from './States';
import { RatingStars } from './StarRating';
import { formatAgo } from '../utils/missionFormat';
import '../styles/reviews.css';

// Section « Avis » d'un profil : note moyenne et derniers avis reçus
export function UserReviews({ userId, empty }: { userId: string; empty: string }) {
    const [data, setData] = useState<UserReviewsData | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        reviewsApi
            .listForUser(userId)
            .then((result) => !cancelled && setData(result))
            .catch((err: Error) => !cancelled && setError(err.message));
        return () => {
            cancelled = true;
        };
    }, [userId]);

    return (
        <section className="card__section" aria-labelledby={`reviews-${userId}`}>
            <h2 className="card__section-title" id={`reviews-${userId}`}>
                <Star size={18} aria-hidden="true" /> Avis
            </h2>

            {error && <Alert variant="error">{error}</Alert>}
            {!data && !error && <Spinner label="Chargement des avis" />}

            {data && data.summary.count === 0 && (
                <p className="empty-value">{empty}</p>
            )}

            {data && data.summary.average !== null && (
                <>
                    <p className="review-summary">
                        <strong>{data.summary.average.toLocaleString('fr-FR', { minimumFractionDigits: 1 })}</strong>
                        <RatingStars value={data.summary.average} size={18} />
                        <span>{data.summary.count} avis</span>
                    </p>
                    <ul className="review-list">
                        {data.items.map((review) => (
                            <li key={review.id} className="review">
                                <div className="review__head">
                                    {review.author && <Avatar {...review.author} size={36} />}
                                    <div className="review__who">
                                        <strong>
                                            {review.author ? `${review.author.firstName} ${review.author.lastName}` : 'Membre supprimé'}
                                        </strong>
                                        <span>
                                            {review.mission?.title ?? 'Mission supprimée'} · {formatAgo(review.createdAt)}
                                        </span>
                                    </div>
                                    <RatingStars value={review.rating} />
                                </div>
                                {review.comment && (
                                    <blockquote className="review__comment">
                                        <MessageSquareQuote size={16} aria-hidden="true" />
                                        <p>{review.comment}</p>
                                    </blockquote>
                                )}
                            </li>
                        ))}
                    </ul>
                </>
            )}
        </section>
    );
}
