// Layout.tsx
// Este componente envolve todas as páginas privadas.
// Tem a navbar no topo e o conteúdo abaixo.
// O <Outlet /> é onde o React Router "injeta" o conteúdo de cada rota.

import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/questions" className="text-lg font-bold text-blue-600">
            Banco de Questões IF
          </Link>

          {/* Links de navegação */}
          <div className="flex items-center gap-6">
            <Link
              to="/questions"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              Questões
            </Link>
            <Link
              to="/dashboard"
              className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
            >
              Dashboard
            </Link>
            {user?.is_admin && (
              <Link
                to="/admin"
                className="text-sm text-gray-600 hover:text-blue-600 transition-colors"
              >
                Admin
              </Link>
            )}
          </div>

          {/* Usuário logado */}
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Olá, {user?.name.split(' ')[0]}</span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      </nav>

      {/* Conteúdo da página */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}