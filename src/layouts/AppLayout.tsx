import { NavLink, Outlet } from 'react-router-dom'
import { navigationItems } from '@/app/navigation'

function renderNavIcon(id: (typeof navigationItems)[number]['id']) {
  const commonProps = {
    className: 'nav-link__icon-svg',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  switch (id) {
    case 'home':
      return (
        <svg {...commonProps}>
          <path d="M4 11.5L12 5l8 6.5" />
          <path d="M6.5 10.5V19h11v-8.5" />
          <path d="M10 19v-5h4v5" />
        </svg>
      )
    case 'browse':
      return (
        <svg {...commonProps}>
          <path d="M7 6.5v11" />
          <path d="M7 10.5h4.5" />
          <path d="M7 15h5.5" />
          <circle cx="7" cy="6.5" r="1.1" />
          <circle cx="11.5" cy="10.5" r="1.1" />
          <circle cx="12.5" cy="15" r="1.1" />
          <path d="M12.6 15h3.2" />
          <circle cx="16.5" cy="15" r="1.1" />
        </svg>
      )
    case 'search':
      return (
        <svg {...commonProps}>
          <circle cx="11" cy="11" r="5.5" />
          <path d="M15.2 15.2L19 19" />
        </svg>
      )
    case 'download':
      return (
        <svg {...commonProps}>
          <path d="M12 5v9" />
          <path d="M8.5 11.5L12 15l3.5-3.5" />
          <path d="M5 18.5h14" />
        </svg>
      )
    case 'contact':
      return (
        <svg {...commonProps}>
          <rect x="4.5" y="6.5" width="15" height="11" rx="2" />
          <path d="M5.5 8l6.5 5 6.5-5" />
        </svg>
      )
    case 'help':
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8" />
          <path d="M9.8 9.3a2.4 2.4 0 0 1 4.6.9c0 1.8-2.2 2.2-2.2 4" />
          <path d="M12 17.2h.01" />
        </svg>
      )
    default:
      return null
  }
}

export function AppLayout() {
  const currentYear = new Date().getFullYear()

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <img
            className="brand__mark"
            src="/PlantscNet_minilogo.webp"
            alt="PlantscNet mini logo"
          />
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
                  <span className="nav-link__icon">{renderNavIcon(item.id)}</span>
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
        <span>{`PlantscNet | Jilin Agricultural University | Changchun, Jilin, China | ${currentYear}`}</span>
      </footer>
    </div>
  )
}
