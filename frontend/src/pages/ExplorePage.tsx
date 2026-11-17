import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { List, Map, RotateCcw, Search, ChevronDown } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { ApiError, exploreApi } from '../services/api'
import { Button } from '../components/Button'
import { MissionCard } from '../components/MissionCard'
import { MissionMap } from '../components/MissionMap'
import { CATEGORIES } from '../constants/categories'
import type { Mission } from '../types/mission'

type DraftFilters = {
  q: string
  category: string
  minReward: string
  maxReward: string
  sort: string
}

type SearchParamsSetter = ReturnType<typeof useSearchParams>[1]

const emptyFilters: DraftFilters = {
  q: '',
  category: '',
  minReward: '',
  maxReward: '',
  sort: 'date_desc',
}

function readFilters(params: URLSearchParams): DraftFilters {
  return {
    q: params.get('q') ?? '',
    category: params.get('category') ?? '',
    minReward: params.get('minReward') ?? '',
    maxReward: params.get('maxReward') ?? '',
    sort: params.get('sort') ?? 'date_desc',
  }
}

function buildApiQuery(params: URLSearchParams) {
  const query = new URLSearchParams()
  for (const key of ['q', 'category', 'minReward', 'maxReward', 'sort']) {
    const value = params.get(key)
    if (value) query.set(key, value)
  }
  return query.toString()
}

function errorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 401) {
    return 'Ta session a expiré. Reconnecte-toi pour voir les missions.'
  }
  if (error instanceof Error) return error.message
  return 'Les missions ne peuvent pas être chargées pour le moment.'
}

function LoadingCards() {
  return (
    <div className="mission-list" aria-label="Chargement des missions" aria-busy="true">
      {Array.from({ length: 3 }, (_, index) => (
        <div className="mission-skeleton" key={index}>
          <span />
          <span />
          <span />
        </div>
      ))}
    </div>
  )
}

function SearchFilters({
  params,
  view,
  setSearchParams,
}: {
  params: URLSearchParams
  view: 'list' | 'map'
  setSearchParams: SearchParamsSetter
}) {
  const [draft, setDraft] = useState(() => readFilters(params))
  const previousParams = useRef(new URLSearchParams(params))
  const debouncedQuery = useRef<string | null>(null)

  useEffect(() => {
    const query = draft.q.trim()
    const appliedQuery = query.length === 1 ? '' : query
    const currentQuery = params.get('q') ?? ''
    if (appliedQuery === currentQuery) return

    const timeout = window.setTimeout(() => {
      const next = new URLSearchParams(params)
      if (appliedQuery) next.set('q', appliedQuery)
      else next.delete('q')
      debouncedQuery.current = appliedQuery
      setSearchParams(next, { replace: true })
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [draft.q, params, setSearchParams])

  useEffect(() => {
    const previous = previousParams.current
    const changedKeys = ['q', 'category', 'minReward', 'maxReward', 'sort'].filter(
      (key) => previous.get(key) !== params.get(key),
    )
    previousParams.current = new URLSearchParams(params)

    if (changedKeys.length === 0) return
    if (changedKeys.length === 1 && changedKeys[0] === 'q') {
      const query = params.get('q') ?? ''
      if (debouncedQuery.current === query) {
        debouncedQuery.current = null
        return
      }
      setDraft((current) => (current.q === query ? current : { ...current, q: query }))
      return
    }

    debouncedQuery.current = null
    setDraft(readFilters(params))
  }, [params])

  function applyFilters(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    debouncedQuery.current = null
    const next = new URLSearchParams()
    for (const [key, value] of Object.entries(draft)) {
      if (value) next.set(key, value)
    }
    if (view === 'map') next.set('view', 'map')
    setSearchParams(next)
  }

  function clearFilters() {
    setDraft(emptyFilters)
    debouncedQuery.current = null
    setSearchParams(view === 'map' ? { view: 'map' } : {})
  }

  return (
    <form className="filter-form" onSubmit={applyFilters}>
      <label className="search-field">
        <span>Rechercher une mission</span>
        <span className="input-with-icon">
          <Search size={19} aria-hidden="true" />
          <input
            type="search"
            value={draft.q}
            maxLength={80}
            onChange={(event) => setDraft((current) => ({ ...current, q: event.target.value }))}
            placeholder="Ex. montage de meubles"
          />
        </span>
      </label>
      <label>
        <span>Catégorie</span>
        <span className="select-field">
          <select
            value={draft.category}
            onChange={(event) => setDraft({ ...draft, category: event.target.value })}
          >
            <option value="">Toutes les catégories</option>
            {CATEGORIES.map((category) => (
              <option key={category.slug} value={category.slug}>
                {category.label}
              </option>
            ))}
          </select>
          <ChevronDown className="select-chevron" size={16} aria-hidden="true" />
        </span>
      </label>
      <label>
        <span>Prime min. (€)</span>
        <input
          type="number"
          min="5"
          max="500"
          step="0.5"
          value={draft.minReward}
          onChange={(event) => setDraft({ ...draft, minReward: event.target.value })}
          placeholder="5"
        />
      </label>
      <label>
        <span>Prime max. (€)</span>
        <input
          type="number"
          min="5"
          max="500"
          step="0.5"
          value={draft.maxReward}
          onChange={(event) => setDraft({ ...draft, maxReward: event.target.value })}
          placeholder="500"
        />
      </label>
      <label>
        <span>Trier par</span>
        <span className="select-field">
          <select value={draft.sort} onChange={(event) => setDraft({ ...draft, sort: event.target.value })}>
            <option value="date_desc">Date la plus proche</option>
            <option value="date_asc">Date la plus éloignée</option>
            <option value="reward_desc">Prime décroissante</option>
            <option value="reward_asc">Prime croissante</option>
          </select>
          <ChevronDown className="select-chevron" size={16} aria-hidden="true" />
        </span>
      </label>
      <div className="filter-actions">
        <Button className="search-button" type="submit" icon={<Search size={17} />}>
          Rechercher
        </Button>
        <Button
          className="clear-button"
          variant="ghost"
          type="button"
          onClick={clearFilters}
          icon={<RotateCcw size={17} />}
        >
          Réinitialiser
        </Button>
      </div>
    </form>
  )
}

export function ExplorePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const searchKey = searchParams.toString()
  const params = useMemo(() => new URLSearchParams(searchKey), [searchKey])
  const requestKey = buildApiQuery(params)
  const [missions, setMissions] = useState<Mission[]>([])
  const [highlightedId, setHighlightedId] = useState<string | null>(null)
  const [loadedRequestId, setLoadedRequestId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [requestAttempt, setRequestAttempt] = useState(0)
  const requestId = `${requestKey}:${requestAttempt}`
  const view = params.get('view') === 'map' ? 'map' : 'list'
  const isLoading = loadedRequestId !== requestId

  useEffect(() => {
    const controller = new AbortController()

    exploreApi
      .list(requestKey, controller.signal)
      .then((response) => {
        setMissions(response.items)
        setError(null)
        setLoadedRequestId(requestId)
      })
      .catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === 'AbortError') return
        setError(errorMessage(cause))
        setLoadedRequestId(requestId)
      })

    return () => controller.abort()
  }, [requestId, requestKey])

  function changeView(nextView: 'list' | 'map') {
    const next = new URLSearchParams(searchKey)
    if (nextView === 'map') next.set('view', 'map')
    else next.delete('view')
    setSearchParams(next, { replace: true })
  }

  return (
    <div className="explore-page">
      <section className="explore-intro">
        <div className="intro-copy">
          <p className="eyebrow">Le bon coup de main, tout près de chez vous</p>
          <h1>Une mission vous attend.</h1>
          <p>Découvrez les petits services proposés par vos voisins et trouvez celui qui vous correspond.</p>
        </div>
        <div className="intro-art" aria-hidden="true">
          <span className="art-sun" />
          <span className="art-hill art-hill-back" />
          <span className="art-hill art-hill-front" />
          <span className="art-home">H</span>
        </div>
      </section>

      <section className="explore-controls" aria-label="Recherche et filtres">
        <SearchFilters
          params={params}
          view={view}
          setSearchParams={setSearchParams}
        />
        <div className="mobile-view-switch" role="group" aria-label="Affichage des missions">
          <button
            className={view === 'list' ? 'is-selected' : ''}
            type="button"
            aria-pressed={view === 'list'}
            onClick={() => changeView('list')}
          >
            <List size={17} aria-hidden="true" />
            Liste
          </button>
          <button
            className={view === 'map' ? 'is-selected' : ''}
            type="button"
            aria-pressed={view === 'map'}
            onClick={() => changeView('map')}
          >
            <Map size={17} aria-hidden="true" />
            Carte
          </button>
        </div>
      </section>

      <section className={`explore-results view-${view}`} aria-label="Résultats de recherche">
        <div className="results-column">
          <div className="results-heading">
            <div>
              <p className="eyebrow">À proximité</p>
              <h2>{isLoading ? 'Recherche en cours…' : `${missions.length} mission${missions.length === 1 ? '' : 's'}`}</h2>
            </div>
            {!isLoading && missions.length > 0 && <span className="results-hint">Autour de vous</span>}
          </div>

          {error ? (
            <div className="state-card state-error" role="alert">
              <span className="state-icon">!</span>
              <h3>Impossible de charger les missions</h3>
              <p>{error}</p>
              <Button
                variant="secondary"
                type="button"
                onClick={() => setRequestAttempt((attempt) => attempt + 1)}
              >
                Réessayer
              </Button>
            </div>
          ) : isLoading ? (
            <LoadingCards />
          ) : missions.length === 0 ? (
            <div className="state-card">
              <span className="state-icon">⌕</span>
              <h3>Aucune mission pour ces filtres</h3>
              <p>Essayez une autre catégorie ou élargissez votre recherche.</p>
              <Button
                variant="secondary"
                type="button"
                onClick={() => setSearchParams(view === 'map' ? { view: 'map' } : {})}
              >
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <div className="mission-list">
              {missions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  mission={mission}
                  highlighted={highlightedId === mission.id}
                  onHover={setHighlightedId}
                />
              ))}
            </div>
          )}
        </div>
        <aside className="map-column" aria-label="Carte des missions">
          <MissionMap missions={missions} highlightedId={highlightedId} onHover={setHighlightedId} />
        </aside>
      </section>
    </div>
  )
}
