import { Fragment, useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ChevronLeft, Lock, Send } from 'lucide-react';
import { ApiError, MESSAGES_CHANGED_EVENT, messagesApi } from '../services/api';
import type { Conversation, Message } from '../types/message';
import { useDraft } from '../hooks/useDraft';
import { Alert } from '../components/Alert';
import { Avatar } from '../components/Avatar';
import { PageLoader } from '../components/States';
import { StatusBadge } from '../components/StatusBadge';
import { fullName } from '../utils/format';
import { formatDay } from '../utils/missionFormat';
import '../styles/messages.css';

// Conversation ouverte : on vérifie les nouveaux messages toutes les 5 s (onglet visible seulement)
const POLL_MS = 5_000;
const MAX_LENGTH = 2000;

const dayLabel = (iso: string): string =>
    new Date(iso).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
const timeLabel = (iso: string): string =>
    new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

// Ajoute les messages reçus sans doublon (un message envoyé peut revenir avec le rafraîchissement suivant)
const merge = (current: Message[], incoming: Message[]): Message[] => {
    const known = new Set(current.map((m) => m.id));
    const added = incoming.filter((m) => !known.has(m.id));
    return added.length === 0 ? current : [...current, ...added];
};

const messagesChanged = () => window.dispatchEvent(new Event(MESSAGES_CHANGED_EVENT));

function Thread({ messages, otherName }: { messages: Message[]; otherName: string }) {
    const endRef = useRef<HTMLLIElement>(null);
    const lastId = messages.at(-1)?.id;

    // Nouveau message : on fait défiler le fil (et seulement lui) jusqu'en bas
    useEffect(() => {
        endRef.current?.scrollIntoView({ block: 'end' });
    }, [lastId]);

    if (messages.length === 0) {
        return (
            <ol className="message-thread" role="log" aria-live="polite" aria-label={`Messages avec ${otherName}`}>
                <li className="message-thread__empty">Aucun message pour l’instant. Présentez-vous et convenez des détails de la mission.</li>
            </ol>
        );
    }

    return (
        <ol className="message-thread" role="log" aria-live="polite" aria-label={`Messages avec ${otherName}`}>
            {messages.map((message, i) => {
                const day = dayLabel(message.createdAt);
                const newDay = i === 0 || dayLabel(messages[i - 1].createdAt) !== day;
                return (
                    <Fragment key={message.id}>
                        {newDay && (
                            <li className="message-day">
                                <span>{day}</span>
                            </li>
                        )}
                        <li className={`message${message.mine ? ' message--mine' : ''}`}>
                            {/* Texte affiché tel quel par React (pas de HTML interprété) */}
                            <p className="message__bubble">
                                <span className="visually-hidden">{message.mine ? 'Vous' : otherName} : </span>
                                {message.body}
                            </p>
                            <span className="message__meta">
                                <time dateTime={message.createdAt}>{timeLabel(message.createdAt)}</time>
                                {message.mine && (message.read ? ' · Lu' : ' · Envoyé')}
                            </span>
                        </li>
                    </Fragment>
                );
            })}
            <li ref={endRef} aria-hidden="true" />
        </ol>
    );
}

function MessageForm({ conversationId, otherName, onSent }: { conversationId: string; otherName: string; onSent: (m: Message) => void }) {
    // Brouillon gardé si la session expire pendant la saisie (WCAG 2.2.5)
    const [body, setBody, clearDraft] = useDraft(`message.${conversationId}`, '');
    const [sending, setSending] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const submit = async (e?: FormEvent) => {
        e?.preventDefault();
        const text = body.trim();
        if (!text || sending) return;
        setSending(true);
        setError(null);
        try {
            onSent(await messagesApi.send(conversationId, text));
            setBody('');
            clearDraft();
            inputRef.current?.focus();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Le message n’a pas pu être envoyé.');
        } finally {
            setSending(false);
        }
    };

    // Entrée envoie, Maj + Entrée passe à la ligne
    const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
            e.preventDefault();
            void submit();
        }
    };

    return (
        <form className="message-form" onSubmit={submit} noValidate>
            {error && <Alert variant="error" onClose={() => setError(null)}>{error}</Alert>}
            <label htmlFor="message-body" className="field__label">
                Votre message à {otherName}
            </label>
            <div className="message-form__row">
                <textarea
                    id="message-body"
                    ref={inputRef}
                    className="textarea"
                    rows={2}
                    maxLength={MAX_LENGTH}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    onKeyDown={onKeyDown}
                    aria-describedby="message-hint"
                />
                <button type="submit" className="btn btn--primary" disabled={sending || body.trim() === ''}>
                    <Send size={18} aria-hidden="true" />
                    {sending ? 'Envoi…' : 'Envoyer'}
                </button>
            </div>
            <span id="message-hint" className="message-form__hint">
                Entrée pour envoyer, Maj + Entrée pour aller à la ligne. {body.length}/{MAX_LENGTH} caractères.
            </span>
        </form>
    );
}

// La clé remonte le composant à chaque conversation : son état repart de zéro sans effet de remise à zéro
export function ConversationPage() {
    const { id = '' } = useParams();
    return <ConversationScreen key={id} id={id} />;
}

function ConversationScreen({ id }: { id: string }) {
    const [conversation, setConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [error, setError] = useState<{ message: string; notFound: boolean } | null>(null);
    const lastIdRef = useRef<string | undefined>(undefined);

    // Premier chargement : en-tête et fil complet (le serveur marque mes messages reçus comme lus)
    useEffect(() => {
        const controller = new AbortController();

        Promise.all([messagesApi.conversation(id, controller.signal), messagesApi.messages(id, undefined, controller.signal)])
            .then(([header, { items }]) => {
                setConversation(header);
                setMessages(items);
                lastIdRef.current = items.at(-1)?.id;
                messagesChanged();
            })
            .catch((err: unknown) => {
                if (err instanceof DOMException && err.name === 'AbortError') return;
                setError({
                    message: err instanceof Error ? err.message : 'La conversation n’a pas pu être chargée.',
                    notFound: err instanceof ApiError && (err.status === 404 || err.status === 400)
                });
            });
        return () => controller.abort();
    }, [id]);

    // Rafraîchissement : seulement les messages arrivés depuis le dernier affiché
    const refresh = useCallback(() => {
        if (document.visibilityState !== 'visible') return;
        messagesApi
            .messages(id, lastIdRef.current)
            .then(async ({ items }) => {
                if (items.length === 0) return;
                // L'autre participant a répondu : il a donc ouvert le fil. On recharge tout une fois
                // pour mettre à jour les mentions « Lu » de mes messages précédents.
                const all = items.some((m) => !m.mine) ? (await messagesApi.messages(id)).items : null;
                setMessages((current) => (all ? all : merge(current, items)));
                lastIdRef.current = (all ?? items).at(-1)?.id;
                messagesChanged();
            })
            .catch(() => {
                // Panne réseau passagère : on réessaiera au prochain tour
            });
    }, [id]);

    useEffect(() => {
        if (!conversation) return;
        const timer = window.setInterval(refresh, POLL_MS);
        document.addEventListener('visibilitychange', refresh);
        return () => {
            window.clearInterval(timer);
            document.removeEventListener('visibilitychange', refresh);
        };
    }, [conversation, refresh]);

    const onSent = (message: Message) => {
        setMessages((current) => merge(current, [message]));
        lastIdRef.current = message.id;
    };

    if (error) {
        return (
            <div className="page page--narrow">
                <div className="container">
                    <Link to="/messages" className="conversation-back">
                        <ChevronLeft size={18} aria-hidden="true" />
                        Toutes les conversations
                    </Link>
                    <h1>{error.notFound ? 'Conversation introuvable' : 'Messages'}</h1>
                    <Alert variant="error">
                        {error.notFound
                            ? 'Cette conversation n’existe pas ou ne vous concerne pas. Une conversation s’ouvre quand le client accepte une candidature.'
                            : error.message}
                    </Alert>
                </div>
            </div>
        );
    }

    if (!conversation) return <PageLoader />;

    const { counterpart, mission } = conversation;
    const otherName = counterpart ? fullName(counterpart) : 'Membre supprimé';

    return (
        <div className="page page--narrow">
            <div className="container">
                <Link to="/messages" className="conversation-back">
                    <ChevronLeft size={18} aria-hidden="true" />
                    Toutes les conversations
                </Link>
                <header className="conversation-header">
                    {counterpart && <Avatar {...counterpart} size={48} />}
                    <div>
                        <h1>{otherName}</h1>
                        <p>
                            {conversation.role === 'owner' ? 'Prestataire de votre mission' : 'Client de la mission'} « {mission.title} »
                            {' '}· {formatDay(mission.scheduledAt)}
                        </p>
                    </div>
                    <StatusBadge status={mission.status} />
                </header>

                <section className="card conversation" aria-label={`Conversation avec ${otherName}`}>
                    <Thread messages={messages} otherName={counterpart?.firstName ?? otherName} />
                    {conversation.canWrite ? (
                        <MessageForm conversationId={conversation.id} otherName={counterpart?.firstName ?? otherName} onSent={onSent} />
                    ) : (
                        <p className="message-readonly">
                            <Lock size={16} aria-hidden="true" /> La mission n’est plus en cours : la conversation reste
                            lisible, mais vous ne pouvez plus y écrire.
                        </p>
                    )}
                </section>
            </div>
        </div>
    );
}
