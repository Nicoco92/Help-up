import { Link, Route, Routes } from 'react-router-dom'
import './App.css'
import { SiteLayout } from './components/SiteLayout'
import { ExplorePage } from './pages/ExplorePage'
import { MissionDetailPage } from './pages/MissionDetailPage'

function NotFoundPage() {
  return (
    <main className="detail-page">
      <section className="state-card detail-state">
        <h1>Cette page n’existe pas</h1>
        <p>Retournez à la liste pour découvrir les missions du quartier.</p>
        <Link className="button button--primary" to="/">
          Voir les missions
        </Link>
      </section>
    </main>
  )
}

function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<ExplorePage />} />
        <Route path="missions/:id" element={<MissionDetailPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
