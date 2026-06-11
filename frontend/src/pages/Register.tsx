// Register.tsx
// Tela de cadastro. Após criar a conta, já faz login
// automaticamente e redireciona para /questions.

import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

export default function Register() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    // Validação simples no frontend
    if (form.password !== form.confirmPassword) {
      setError('As senhas não coincidem')
      return
    }
    if (form.password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres')
      return
    }

    setLoading(true)
    setError('')

    try {
      // 1. Cria a conta
      await api.post('/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password
      })

      // 2. Faz login automaticamente
      const { data: tokenData } = await api.post('/auth/login', {
        email: form.email,
        password: form.password
      })

      // 3. Busca dados do usuário
      const { data: userData } = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` }
      })

      // 4. Salva e redireciona
      login(tokenData.access_token, userData)
      navigate('/questions')

    } catch (err: any) {
      setError(err.response?.data?.detail || 'Erro ao criar conta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Banco de Questões IF</h1>
          <p className="text-gray-500 mt-1">Prepare-se para o Instituto Federal</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Criar conta gratuita</h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome completo
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Seu Nome"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

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
                placeholder="Mínimo 6 caracteres"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar senha
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repita a senha"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

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
              {loading ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Já tem conta?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}