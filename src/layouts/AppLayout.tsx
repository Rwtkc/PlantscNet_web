import { NavLink, Outlet } from 'react-router-dom'
import { navigationItems } from '@/app/navigation'

export function AppLayout() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark" aria-hidden />
          <div>
            <p className="brand__name">PlantscNet</p>
            <p className="brand__caption">Plant Single-Cell Network Portal</p>
          </div>
        </div>
        <nav aria-label="Primary">
          <ul className="topbar__nav">
            {navigationItems.map((item) => (
              <li key={item.id}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    isActive ? 'nav-link nav-link--active' : 'nav-link'
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main className="content-wrap">
        <Outlet />
      </main>
      <footer className="footer-note">
        <span>PlantscNet</span>
        <span>Built with React, TypeScript, Vite, and pnpm</span>
      </footer>
    </div>
  )
}
