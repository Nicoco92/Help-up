import { Routes, Route } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './context/AuthContext'
import { Layout } from './components/Layout'
import { RequireAdmin, RequireAuth } from './components/RouteGuards'
import { HomePage } from './pages/HomePage'
import { RegisterPage } from './pages/RegisterPage'
import { LoginPage } from './pages/LoginPage'
import { ProfilePage } from './pages/ProfilePage'
import { UsersListPage } from './pages/UsersListPage'
import { UserProfilePage } from './pages/UserProfilePage'
import { AdminPage } from './pages/AdminPage'
import { ExplorePage } from './pages/ExplorePage'
import { MissionDetailPage } from './pages/MissionDetailPage'
import { MyApplicationsPage } from './pages/MyApplicationsPage'
import { DashboardPage } from './pages/DashboardPage'
import { NotificationsPage } from './pages/NotificationsPage'
import { ConversationsPage } from './pages/ConversationsPage'
import { ConversationPage } from './pages/ConversationPage'
import { MyMissionsPage } from './pages/MyMissionsPage'
import { MissionFormPage } from './pages/MissionFormPage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />

          {/* Un membre déjà connecté est redirigé par la page elle-même */}
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />

          {/* Pages réservées aux membres connectés (l'API exige aussi le JWT) */}
          <Route element={<RequireAuth />}>
            <Route path="missions" element={<ExplorePage />} />
            <Route path="missions/mine" element={<MyMissionsPage />} />
            <Route path="missions/new" element={<MissionFormPage />} />
            <Route path="missions/:id" element={<MissionDetailPage />} />
            <Route path="missions/:id/edit" element={<MissionFormPage />} />
            <Route path="applications" element={<MyApplicationsPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="messages" element={<ConversationsPage />} />
            <Route path="messages/:id" element={<ConversationPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="users" element={<UsersListPage />} />
            <Route path="users/:id" element={<UserProfilePage />} />
            <Route element={<RequireAdmin />}>
              <Route path="admin" element={<AdminPage />} />
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  )
}
