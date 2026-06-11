// App.tsx
// Aqui definimos as rotas da aplicação usando React Router.
// Cada URL corresponde a um componente (página).
// 
// PrivateRoute é um componente que protege rotas:
// se não estiver logado, redireciona para /login.

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Register from './pages/Register'
import Questions from './pages/Questions'
import Dashboard from './pages/Dashboard'
import Admin from './pages/Admin'

// Componente que protege rotas privadas
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

// Rota que só admins podem acessar
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!user?.is_admin) return <Navigate to="/questions" replace />
  return <>{children}</>
}

function AppRoutes() {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      
      {/* Rotas privadas (precisa estar logado) */}
      <Route path="/" element={
        <PrivateRoute>
          <Layout />
        </PrivateRoute>
      }>
        <Route index element={<Navigate to="/questions" replace />} />
        <Route path="questions" element={<Questions />} />
        <Route path="dashboard" element={<Dashboard />} />
        
        {/* Rota só para admins */}
        <Route path="admin" element={
          <AdminRoute>
            <Admin />
          </AdminRoute>
        } />
      </Route>
      
      {/* Qualquer URL desconhecida redireciona para /questions */}
      <Route path="*" element={<Navigate to="/questions" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}