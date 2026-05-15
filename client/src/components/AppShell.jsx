import { Link, NavLink } from 'react-router-dom';
import { LogOut, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';

export function AppShell({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-card/50 backdrop-blur sticky top-0 z-10">
        <div className="container flex h-14 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <BarChart3 className="h-5 w-5 text-primary" />
            <span>Pollit</span>
          </Link>
          <nav className="flex items-center gap-2">
            {user ? (
              <>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `text-sm px-3 py-1.5 rounded-md ${isActive ? 'bg-secondary' : 'hover:bg-secondary'}`
                  }
                >
                  Dashboard
                </NavLink>
                <span className="text-sm text-muted-foreground hidden sm:inline">{user.email}</span>
                <Button size="sm" variant="ghost" onClick={logout} aria-label="Logout">
                  <LogOut className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button asChild size="sm" variant="ghost">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild size="sm">
                  <Link to="/register">Sign up</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 container py-6">{children}</main>
      <footer className="border-t py-4 text-center text-xs text-muted-foreground">
        Pollit · built for the hackathon
      </footer>
    </div>
  );
}
