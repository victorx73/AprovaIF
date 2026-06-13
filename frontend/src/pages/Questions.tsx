// Questions.tsx
// Tela principal do banco de questões.
// Permite filtrar por disciplina, dificuldade, ano e busca por texto.
// Ao clicar em uma questão, abre o modal de resolução.

import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../services/api'
import QuestionModal from '../components/QuestionModal'

// Tipos que espelhamos do backend
interface Discipline {
  id: number
  name: string
}

interface Question {
  id: number
  statement: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  option_e?: string
  difficulty: string
  year?: number
  discipline: Discipline
}

interface QuestionListResponse {
  items: Question[]
  total: number
  page: number
  pages: number
}

// Labels amigáveis para dificuldade
const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Fácil',
  medium: 'Médio',
  hard: 'Difícil'
}

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  hard: 'bg-red-100 text-red-700'
}

export default function Questions() {
  // useSearchParams sincroniza filtros com a URL
  // Ex: /questions?discipline_id=1&difficulty=easy
  // Isso permite compartilhar links e manter estado ao voltar
  const [searchParams, setSearchParams] = useSearchParams()

  // Estados dos filtros (lidos da URL)
  const [disciplineId, setDisciplineId] = useState(searchParams.get('discipline_id') || '')
  const [difficulty, setDifficulty]     = useState(searchParams.get('difficulty') || '')
  const [year, setYear]                 = useState(searchParams.get('year') || '')
  const [search, setSearch]             = useState(searchParams.get('search') || '')
  const [page, setPage]                 = useState(Number(searchParams.get('page')) || 1)

  // Dados carregados da API
  const [disciplines, setDisciplines]   = useState<Discipline[]>([])
  const [data, setData]                 = useState<QuestionListResponse | null>(null)
  const [loading, setLoading]           = useState(true)

  // Questão selecionada para o modal
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null)

  // Carrega as disciplinas uma única vez ao montar o componente
  useEffect(() => {
    api.get('/questions/disciplines')
      .then(res => setDisciplines(res.data))
      .catch(console.error)
  }, [])

  // Carrega as questões sempre que os filtros ou página mudam
  useEffect(() => {
    loadQuestions()
  }, [disciplineId, difficulty, year, search, page])

  async function loadQuestions() {
    setLoading(true)
    try {
      // Monta os parâmetros dinamicamente (ignora valores vazios)
      const params: Record<string, string> = { page: String(page), size: '10' }
      if (disciplineId) params.discipline_id = disciplineId
      if (difficulty)   params.difficulty    = difficulty
      if (year)         params.year          = year
      if (search)       params.search        = search

      const res = await api.get('/questions', { params })
      setData(res.data)

      // Atualiza a URL com os filtros atuais
      setSearchParams(params)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Quando muda qualquer filtro, volta para a página 1
  function handleFilterChange(key: string, value: string) {
    setPage(1)
    if (key === 'discipline_id') setDisciplineId(value)
    if (key === 'difficulty')    setDifficulty(value)
    if (key === 'year')          setYear(value)
  }

  // Busca com debounce manual: só busca após parar de digitar
  function handleSearchChange(value: string) {
    setSearch(value)
    setPage(1)
  }

  function clearFilters() {
    setDisciplineId('')
    setDifficulty('')
    setYear('')
    setSearch('')
    setPage(1)
  }

  const hasFilters = disciplineId || difficulty || year || search

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Banco de Questões</h1>
        <p className="text-gray-500 text-sm mt-1">
          Pratique com questões reais dos Institutos Federais
        </p>
      </div>

      {/* ── Filtros ── */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

          {/* Busca por texto */}
          <div className="lg:col-span-1">
            <input
              type="text"
              placeholder="Buscar no enunciado..."
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filtro de disciplina */}
          <select
            value={disciplineId}
            onChange={e => handleFilterChange('discipline_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Todas as disciplinas</option>
            {disciplines.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Filtro de dificuldade */}
          <select
            value={difficulty}
            onChange={e => handleFilterChange('difficulty', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Qualquer dificuldade</option>
            <option value="easy">Fácil</option>
            <option value="medium">Médio</option>
            <option value="hard">Difícil</option>
          </select>

          {/* Filtro de ano */}
          <select
            value={year}
            onChange={e => handleFilterChange('year', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="">Qualquer ano</option>
            {[2024, 2023, 2022, 2021, 2020, 2019, 2018].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Botão limpar filtros — só aparece se há algum filtro ativo */}
        {hasFilters && (
          <div className="mt-3 flex justify-end">
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* ── Resultados ── */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Carregando...</div>
      ) : !data || data.items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-400 text-lg">Nenhuma questão encontrada</p>
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="mt-2 text-sm text-blue-600 hover:underline"
            >
              Limpar filtros
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Contador */}
          <p className="text-sm text-gray-500 mb-4">
            {data.total} {data.total === 1 ? 'questão encontrada' : 'questões encontradas'}
          </p>

          {/* Lista de questões */}
          <div className="space-y-3">
            {data.items.map(question => (
              <div
                key={question.id}
                onClick={() => setSelectedQuestion(question)}
                className="bg-white rounded-xl border border-gray-200 p-5 cursor-pointer
                           hover:border-blue-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <p className="text-gray-800 text-sm leading-relaxed line-clamp-2 flex-1">
                    {question.statement}
                  </p>
                  <span className="text-blue-600 text-sm font-medium shrink-0 hover:underline">
                    Resolver →
                  </span>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
                    {question.discipline.name}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${DIFFICULTY_COLORS[question.difficulty]}`}>
                    {DIFFICULTY_LABELS[question.difficulty]}
                  </span>
                  {question.year && (
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                      {question.year}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ── Paginação ── */}
          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => p - 1)}
                disabled={page === 1}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg
                           hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>

              <span className="text-sm text-gray-500 px-2">
                Página {page} de {data.pages}
              </span>

              <button
                onClick={() => setPage(p => p + 1)}
                disabled={page === data.pages}
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg
                           hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Próxima →
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal de resolução — aparece quando uma questão é selecionada */}
      {selectedQuestion && (
        <QuestionModal
          question={selectedQuestion}
          onClose={() => setSelectedQuestion(null)}
        />
      )}
    </div>
  )
}