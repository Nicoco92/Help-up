import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BellRing,
  Calendar,
  Clock,
  Hammer,
  HandCoins,
  MapPin,
  Megaphone,
  Star,
  Truck,
  UserRound,
  Users,
  Briefcase,
  Zap,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { CATEGORIES } from '../constants/categories'
import { Footer } from '../components/Layout'
import { Avatar } from '../components/Avatar'
import { profileCompletion } from '../utils/format'
import type { User } from '../types/auth'

const STEPS = [
  {
    icon: Megaphone,
    title: 'Publie une mission',
    text: 'Décris ton besoin, ton quartier et la prime proposée. Ça prend une minute.',
  },
  {
    icon: BellRing,
    title: 'Les voisins sont prévenus',
    text: 'Les étudiants et personnes disponibles près de chez toi reçoivent ta mission.',
  },
  {
    icon: UserRound,
    title: 'Choisis ton candidat',
    text: 'Consulte les profils et les avis, puis accepte la candidature qui te convient.',
  },
  {
    icon: Star,
    title: 'Mission faite, chacun note',
    text: 'Paiement dans l’app ou sur place, puis un avis réciproque pour la confiance.',
  },
]

function MissionPreview() {
  return (
    <div className="preview" aria-hidden="true">
      <div className="preview-card">
        <div className="preview-card__top">
          <span>
            <Hammer size={16} /> Bricolage
          </span>
          <span className="badge badge--signal">
            <Zap size={12} /> Urgent
          </span>
        </div>
        <h3>Monter une armoire 2 portes</h3>
        <div className="preview-card__meta">
          <span>
            <MapPin size={14} /> Butte-aux-Cailles
          </span>
          <span>
            <Calendar size={14} /> Sam. 14 déc.
          </span>
          <span>
            <Clock size={14} /> 2 h
          </span>
        </div>
        <div className="preview-card__bottom">
          <span className="preview-card__who">
            <Avatar firstName="Claire" lastName="M" size={28} /> Claire M.
          </span>
          <span className="price">45 €</span>
        </div>
      </div>
      <div className="preview-card">
        <div className="preview-card__top">
          <span>
            <Truck size={16} /> Déménagement
          </span>
        </div>
        <h3>Porter des cartons au 3ᵉ étage</h3>
        <div className="preview-card__meta">
          <span>
            <MapPin size={14} /> Villejuif
          </span>
          <span>
            <Clock size={14} /> 1 h 30
          </span>
        </div>
        <div className="preview-card__bottom">
          <span className="preview-card__who">
            <Avatar firstName="Karim" lastName="B" size={28} /> Karim B.
          </span>
          <span className="price">30 €</span>
        </div>
      </div>
    </div>
  )
}

function GuestHome() {
  return (
    <>
      <section className="hero">
        <div className="container hero__grid">
          <div>
            <span className="eyebrow">
              <MapPin size={16} aria-hidden="true" /> Mini-jobs entre voisins
            </span>
            <h1>
              Un coup de main, <em>une petite prime.</em>
            </h1>
            <p className="hero__lead">
              HelpUP met en relation les habitants d’un même quartier : tu publies une mission,
              un étudiant disponible près de chez toi s’en charge.
            </p>
            <div className="hero__actions">
              <Link to="/register" className="btn btn--primary">
                Créer mon compte
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
              <Link to="/login" className="btn btn--outline" style={{ minHeight: 48 }}>
                J’ai déjà un compte
              </Link>
            </div>
            <div className="hero__trust">
              <span>
                <Star size={16} aria-hidden="true" /> Avis après chaque mission
              </span>
              <span>
                <MapPin size={16} aria-hidden="true" /> Près de chez toi
              </span>
              <span>
                <HandCoins size={16} aria-hidden="true" /> Prime fixée à l’avance
              </span>
            </div>
          </div>
          <MissionPreview />
        </div>
      </section>

      <section className="section section--surface">
        <div className="container">
          <div className="section__head">
            <span className="eyebrow">Comment ça marche</span>
            <h2>De la demande au coup de main, en quatre étapes</h2>
          </div>
          <ol className="steps" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {STEPS.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="step">
                <span className="step__icon" aria-hidden="true">
                  <Icon size={22} />
                </span>
                <span className="step__num">ÉTAPE {i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section__head">
            <span className="eyebrow">Les missions</span>
            <h2>Tous les petits services du quotidien</h2>
            <p>Des tâches simples, ponctuelles et rémunérées, à deux pas de chez toi.</p>
          </div>
          <ul className="categories" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {CATEGORIES.map(({ slug, label, icon: Icon }) => (
              <li key={slug} className="category">
                <span className="category__icon" aria-hidden="true">
                  <Icon size={20} />
                </span>
                {label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="cta">
            <div>
              <h2>Ton temps a de la valeur.</h2>
              <p>Inscris-toi gratuitement et rejoins les voisins qui s’entraident.</p>
            </div>
            <Link to="/register" className="btn btn--primary">
              Rejoindre HelpUP
              <ArrowRight size={18} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
      <Footer />
    </>
  )
}

function MemberHome({ user }: { user: User }) {
  const { percent, missing } = profileCompletion(user)
  const hour = new Date().getHours()
  const greeting = hour < 5 || hour >= 18 ? 'Bonsoir' : 'Bonjour'

  return (
    <div className="page">
      <div className="container">
        <div className="welcome">
          <Avatar {...user} size={64} />
          <div>
            <h1>
              {greeting} {user.firstName} 👋
            </h1>
            <p className="muted" style={{ marginTop: 4 }}>
              Content de te revoir sur HelpUP.
            </p>
          </div>
        </div>

        <div className="quick-grid">
          {percent < 100 && (
            <Link to="/profile" className="card card--interactive quick">
              <span className="eyebrow">Profil complété à {percent} %</span>
              <div className="progress" aria-hidden="true">
                <div className="progress__bar" style={{ width: `${percent}%` }} />
              </div>
              <h3>
                Complète ton profil <ArrowRight size={18} aria-hidden="true" />
              </h3>
              <p>Ajoute {missing.slice(0, 2).join(' et ')} pour inspirer confiance.</p>
            </Link>
          )}

          <Link to="/users" className="card card--interactive quick">
            <span className="step__icon" style={{ marginBottom: 0 }} aria-hidden="true">
              <Users size={22} />
            </span>
            <h3>
              Découvre les membres <ArrowRight size={18} aria-hidden="true" />
            </h3>
            <p>Parcours les profils et les compétences de ton quartier.</p>
          </Link>

          <Link to="/missions" className="card card--interactive quick">
            <span className="step__icon" style={{ marginBottom: 0 }} aria-hidden="true">
              <Briefcase size={22} />
            </span>
            <h3>
              Explore les missions <ArrowRight size={18} aria-hidden="true" />
            </h3>
            <p>Liste ou carte : trouve un coup de main à donner près de chez toi.</p>
          </Link>
        </div>
      </div>
    </div>
  )
}

export function HomePage() {
  const { user } = useAuth()
  return user ? <MemberHome user={user} /> : <GuestHome />
}
