// api.ts
// Aqui configuramos o Axios, que é a biblioteca que faz as chamadas HTTP
// do nosso frontend para o backend.
// 
// Criamos uma "instância" com a URL base configurada,
// e um interceptor que adiciona automaticamente o token JWT
// em todas as requisições autenticadas.

import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api',
})

// Interceptor de requisição:
// Antes de cada chamada, verifica se há um token salvo e o adiciona no header
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Interceptor de resposta:
// Se o backend retornar 401 (não autorizado), desloga o usuário
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api