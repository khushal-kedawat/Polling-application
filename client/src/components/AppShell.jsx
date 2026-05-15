import { Link, NavLink } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

const YEAR = new Date().getFullYear();

export function AppShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <Header />
      <main className="flex-1 container py-8 lg:py-12">{children}</main>
      <Footer />
    </div>
  );
}

function Brand() {
  return (
    <Link to="/" className="flex items-center gap-2 group">
      <span className="font-display text-xl tracking-tightest">Pollit</span>
      <span className="font-mono text-[10px] tracking-widest text-muted-foreground border border-border-soft px-1.5 py-0.5 group-hover:border-border-strong/40 transition-colors">
        v1.0
      </span>
    </Link>
  );
}

function Header() {
  const { user, logout } = useAuth();

  const navItem = ({ isActive }) =>
    `mono-label hover:text-foreground transition-colors ${isActive ? 'text-foreground' : ''}`;

  return (
    <header className="border-b border-border-strong/30 sticky top-0 z-20 bg-background/85 backdrop-blur">
      <div className="container flex h-16 items-center justify-between gap-6">
        <Brand />
        <nav className="hidden md:flex items-center gap-8">
          <NavLink to="/" className={navItem} end>
            <span className="text-primary mr-1">01</span> HOME
          </NavLink>
          {user && (
            <NavLink to="/dashboard" className={navItem}>
              <span className="text-primary mr-1">02</span> DASHBOARD
            </NavLink>
          )}
          <a
            href="https://github.com/khushal-kedawat/Polling-application"
            target="_blank"
            rel="noreferrer"
            className="mono-label hover:text-foreground transition-colors"
          >
            <span className="text-primary mr-1">03</span> GITHUB
          </a>
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden sm:inline font-mono text-[11px] tracking-wider text-muted-foreground">
                {user.email}
              </span>
              <Button size="sm" variant="ghost" onClick={logout} aria-label="Sign out">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild size="sm" variant="ghost">
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild size="sm">
                <Link to="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border-strong/30 mt-16">
      <div className="container py-12 grid gap-10 md:grid-cols-[1.2fr_1fr_1fr_1fr]">
        <div className="space-y-3 max-w-sm">
          <Brand />
          <p className="text-sm text-muted-foreground leading-relaxed">
            A real-time polling platform. Build, share, analyze, publish — all from one elegant
            interface.
          </p>
        </div>

        <FooterColumn
          label="Product"
          items={[
            { label: 'Home', to: '/' },
            { label: 'Sign in', to: '/login' },
            { label: 'Get started', to: '/register' },
          ]}
        />
        <FooterColumn
          label="Resources"
          items={[
            { label: 'GitHub', href: 'https://github.com/khushal-kedawat/Polling-application' },
            { label: 'README', href: 'https://github.com/khushal-kedawat/Polling-application#readme' },
          ]}
        />
        <FooterColumn
          label="Stack"
          items={[
            { label: 'React + Vite', static: true },
            { label: 'Express + Socket.io', static: true },
            { label: 'Postgres + Drizzle', static: true },
          ]}
        />
      </div>

      <div className="border-t border-border-soft">
        <div className="container py-5 flex flex-col sm:flex-row items-center justify-between gap-3 font-mono text-[11px] tracking-widest text-muted-foreground">
          <span>© {YEAR} POLLIT · BUILT FOR THE HACKATHON</span>
          <span>ALL SYSTEMS OPERATIONAL · v1.0</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ label, items }) {
  return (
    <div className="space-y-3">
      <div className="mono-label">{label}</div>
      <ul className="space-y-2">
        {items.map((it) => (
          <li key={it.label} className="text-sm">
            {it.to ? (
              <Link to={it.to} className="text-foreground/80 hover:text-primary transition-colors">
                {it.label}
              </Link>
            ) : it.href ? (
              <a
                href={it.href}
                target="_blank"
                rel="noreferrer"
                className="text-foreground/80 hover:text-primary transition-colors"
              >
                {it.label}
              </a>
            ) : (
              <span className="text-muted-foreground">{it.label}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
