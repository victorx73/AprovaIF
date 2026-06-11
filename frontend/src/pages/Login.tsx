// Login.tsx
// Tela de login com formulário simples.
// Ao enviar, chama POST /api/auth/login, salva o token
// e redireciona para /questions.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()

  // Estado do formulário
  const [form, setForm] = useState({ email: '', password: '' })
  
  // Estado de loading e erro
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Atualiza apenas o campo que mudou, mantendo os outros
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('') // limpa o erro ao digitar
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault() // evita recarregar a página
    setLoading(true)
    setError('')

    try {
      // 1. Faz login e pega o token
      const { data: tokenData } = await api.post('/auth/login', form)
      
      // 2. Busca os dados completos do usuário
      const { data: userData } = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      })
      
      // 3. Salva no contexto (e no localStorage)
      login(tokenData.access_token, userData)
      
      // 4. Redireciona
      navigate('/questions')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        
        {/* Cabeçalho */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Banco de Questões IF</h1>
          <p className="text-gray-500 mt-1">Prepare-se para o Instituto Federal</p>
        </div>

        {/* Card do formulário */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Entrar na sua conta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="seu@email.com"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Senha
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Mensagem de erro */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium
                         hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Não tem conta?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">
              Criar conta
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}