import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/context/AuthContext';
import { AppShell } from '@/components/AppShell';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Dashboard from '@/pages/Dashboard';
import PollCreate from '@/pages/PollCreate';
import PollDetail from '@/pages/PollDetail';
import PublicPoll from '@/pages/PublicPoll';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/p/:slug" element={<PublicPoll />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/new"
              element={
                <ProtectedRoute>
                  <PollCreate />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/polls/:id"
              element={
                <ProtectedRoute>
                  <PollDetail />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<p>Not found.</p>} />
          </Routes>
        </AppShell>
        <Toaster richColors position="top-right" />
      </BrowserRouter>
    </AuthProvider>
  );
}
