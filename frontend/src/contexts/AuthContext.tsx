// AuthContext.tsx
// O Context do React é uma forma de compartilhar dados entre componentes
// sem precisar passar props manualmente de pai para filho para neto...
// 
// Aqui guardamos: quem está logado, o token JWT, e funções de login/logout.
// Qualquer componente da aplicação pode acessar esses dados com useAuth().

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: number
  name: string
  email: string
  is_admin: boolean
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
  logout: () => void
  isAuthenticated: boolean
}

// Cria o contexto com valor padrão null (será preenchido pelo Provider)
const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  // Tenta recuperar dados do localStorage ao carregar a página
  // (para o usuário não perder a sessão ao atualizar)
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })
  
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token')
  })

  function login(newToken: string, newUser: User) {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
  }

  function logout() {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{
      user,
      token,
      login,
      logout,
      isAuthenticated: !!token
    }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook customizado — mais limpo do que usar useContext(AuthContext) direto
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return context
}