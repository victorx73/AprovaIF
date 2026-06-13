// Admin.tsx
// Painel administrativo para gerenciar questões e disciplinas.
// Só acessível para usuários com is_admin = true.
// 
// Funcionalidades:
// - Criar disciplinas
// - Criar questões
// - Listar questões com opção de deletar

import { useState, useEffect } from 'react'
import api from '../services/api'

interface Discipline {
  id: number
  name: string
}

interface Question {
  id: number
  statement: string
  difficulty: string
  year?: number
  discipline: Discipline
}

// Estado inicial do formulário de questão (facilita o reset após salvar)
const EMPTY_QUESTION = {
  statement: '',
  option_a: '',
  option_b: '',
  option_c: '',
  option_d: '',
  option_e: '',
  correct_answer: 'a',
  explanation: '',
  difficulty: 'medium',
  year: '',
  discipline_id: ''
}

export default function Admin() {
  const [tab, setTab]             = useState<'questions' | 'disciplines'>('questions')
  const [disciplines, setDisciplines] = useState<Discipline[]>([])
  const [questions, setQuestions] = useState<Question[]>([])
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState(EMPTY_QUESTION)
  const [newDiscipline, setNewDiscipline] = useState('')
  const [loading, setLoading]     = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg]   = useState('')

  useEffect(() => {
    loadDisciplines()
    loadQuestions()
  }, [])

  async function loadDisciplines() {
    const res = await api.get('/questions/disciplines')
    setDisciplines(res.data)
  }

  async function loadQuestions() {
    const res = await api.get('/questions?size=50')
    setQuestions(res.data.items)
  }

  function showSuccess(msg: string) {
    setSuccessMsg(msg)
    setErrorMsg('')
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  function showError(msg: string) {
    setErrorMsg(msg)
    setSuccessMsg('')
  }

  async function handleCreateDiscipline(e: React.FormEvent) {
    e.preventDefault()
    if (!newDiscipline.trim()) return
    try {
      await api.post('/questions/disciplines', { name: newDiscipline.trim() })
      setNewDiscipline('')
      loadDisciplines()
      showSuccess('Disciplina criada!')
    } catch (err: any) {
      showError(err.response?.data?.detail || 'Erro ao criar disciplina')
    }
  }

  async function handleCreateQuestion(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/questions', {
        ...form,
        year: form.year ? Number(form.year) : null,
        discipline_id: Number(form.discipline_id),
        option_e: form.option_e || null
      })
      setForm(EMPTY_QUESTION)
      setShowForm(false)
      loadQuestions()
      showSuccess('Questão criada com sucesso!')
    } catch (err: any) {
      showError(err.response?.data?.detail || 'Erro ao criar questão')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Remover esta questão?')) return
    try {
      await api.delete(`/questions/${id}`)
      loadQuestions()
      showSuccess('Questão removida')
    } catch {
      showError('Erro ao remover questão')
    }
  }

  function handleFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
        <p className="text-gray-500 text-sm mt-1">Gerencie questões e disciplinas</p>
      </div>

      {/* Mensagens de feedback */}
      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-green-50 border border-green-200
                        text-green-700 text-sm rounded-lg">
          ✓ {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200
                        text-red-700 text-sm rounded-lg">
          {errorMsg}
        </div>
      )}

      {/* Abas */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        <button
          onClick={() => setTab('questions')}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
            tab === 'questions'
              ? 'bg-white text-gray-900 shadow-sm font-medium'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Questões ({questions.length})
        </button>
        <button
          onClick={() => setTab('disciplines')}
          className={`px-4 py-2 text-sm rounded-md transition-colors ${
            tab === 'disciplines'
              ? 'bg-white text-gray-900 shadow-sm font-medium'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Disciplinas ({disciplines.length})
        </button>
      </div>

      {/* ── Aba de Questões ── */}
      {tab === 'questions' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-gray-500">{questions.length} questões cadastradas</p>
            <button
              onClick={() => setShowForm(!showForm)}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg
                         hover:bg-blue-700 transition-colors"
            >
              {showForm ? 'Cancelar' : '+ Nova Questão'}
            </button>
          </div>

          {/* Formulário de criação */}
          {showForm && (
            <form
              onSubmit={handleCreateQuestion}
              className="bg-white border border-gray-200 rounded-xl p-6 mb-6 space-y-4"
            >
              <h2 className="font-semibold text-gray-800">Nova Questão</h2>

              {/* Enunciado */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enunciado *
                </label>
                <textarea
                  name="statement"
                  value={form.statement}
                  onChange={handleFormChange}
                  required
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Digite o enunciado da questão..."
                />
              </div>

              {/* Alternativas A, B, C, D em grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {(['a', 'b', 'c', 'd'] as const).map(letter => (
                  <div key={letter}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alternativa {letter.toUpperCase()} *
                    </label>
                    <input
                      type="text"
                      name={`option_${letter}`}
                      value={form[`option_${letter}` as keyof typeof form]}
                      onChange={handleFormChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                                 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder={`Texto da alternativa ${letter.toUpperCase()}`}
                    />
                  </div>
                ))}
              </div>

              {/* Alternativa E (opcional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alternativa E (opcional)
                </label>
                <input
                  type="text"
                  name="option_e"
                  value={form.option_e}
                  onChange={handleFormChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Deixe em branco se não houver"
                />
              </div>

              {/* Linha: Resposta, Disciplina, Dificuldade, Ano */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Resposta correta *
                  </label>
                  <select
                    name="correct_answer"
                    value={form.correct_answer}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="a">A</option>
                    <option value="b">B</option>
                    <option value="c">C</option>
                    <option value="d">D</option>
                    <option value="e">E</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Disciplina *
                  </label>
                  <select
                    name="discipline_id"
                    value={form.discipline_id}
                    onChange={handleFormChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Selecione</option>
                    {disciplines.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dificuldade
                  </label>
                  <select
                    name="difficulty"
                    value={form.difficulty}
                    onChange={handleFormChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="easy">Fácil</option>
                    <option value="medium">Médio</option>
                    <option value="hard">Difícil</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ano
                  </label>
                  <input
                    type="number"
                    name="year"
                    value={form.year}
                    onChange={handleFormChange}
                    min="2000"
                    max="2030"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                               focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="2023"
                  />
                </div>
              </div>

              {/* Explicação */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Explicação da resposta (opcional)
                </label>
                <textarea
                  name="explanation"
                  value={form.explanation}
                  onChange={handleFormChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  placeholder="Explique por que a resposta está correta..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setForm(EMPTY_QUESTION) }}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300
                             rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg
                             hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Salvando...' : 'Salvar questão'}
                </button>
              </div>
            </form>
          )}

          {/* Lista de questões */}
          <div className="space-y-2">
            {questions.map(q => (
              <div
                key={q.id}
                className="bg-white border border-gray-200 rounded-xl px-5 py-4
                           flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 line-clamp-1">{q.statement}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full">
                      {q.discipline.name}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                      {q.difficulty === 'easy' ? 'Fácil' : q.difficulty === 'medium' ? 'Médio' : 'Difícil'}
                    </span>
                    {q.year && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                        {q.year}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(q.id)}
                  className="text-xs text-red-400 hover:text-red-600 shrink-0
                             transition-colors px-2 py-1 rounded hover:bg-red-50"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Aba de Disciplinas ── */}
      {tab === 'disciplines' && (
        <div>
          {/* Formulário rápido */}
          <form onSubmit={handleCreateDiscipline} className="flex gap-3 mb-6">
            <input
              type="text"
              value={newDiscipline}
              onChange={e => setNewDiscipline(e.target.value)}
              placeholder="Nome da disciplina (ex: Matemática)"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg
                         hover:bg-blue-700 transition-colors"
            >
              Adicionar
            </button>
          </form>

          {/* Lista de disciplinas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {disciplines.map(d => (
              <div
                key={d.id}
                className="bg-white border border-gray-200 rounded-xl px-4 py-3
                           flex items-center justify-between"
              >
                <span className="text-sm text-gray-700">{d.name}</span>
                <span className="text-xs text-gray-400">#{d.id}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}