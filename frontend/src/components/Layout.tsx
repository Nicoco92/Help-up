import { Outlet } from 'react-router-dom'
import { Navbar } from './Navbar'

export function Layout() {
  return (
    <>
      <Navbar />
      <main id="contenu" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Outlet />
      </main>
    </>
  )
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <span>© {new Date().getFullYear()} HelpUP · Un coup de main, une petite prime.</span>
        <span>Projet étudiant Efrei · Full Stack JS</span>
      </div>
    </footer>
  )
}
