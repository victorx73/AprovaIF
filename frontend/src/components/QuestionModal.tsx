// QuestionModal.tsx
// Modal que exibe uma questão para resolução.
// Fluxo:
// 1. Aluno vê o enunciado e as alternativas
// 2. Clica em uma alternativa
// 3. Resposta é enviada para o backend
// 4. Backend retorna se acertou + resposta correta + explicação
// 5. Alternativas ficam coloridas (verde = certa, vermelho = errada escolhida)

import { useState } from 'react'
import api from '../services/api'

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

interface AnswerResult {
  is_correct: boolean
  correct_answer: string
  explanation?: string
  selected_answer: string
}

interface Props {
  question: Question
  onClose: () => void
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Fácil',
  medium: 'Médio',
  hard: 'Difícil'
}

export default function QuestionModal({ question, onClose }: Props) {
  const [selected, setSelected]   = useState<string | null>(null)
  const [result, setResult]       = useState<AnswerResult | null>(null)
  const [loading, setLoading]     = useState(false)

  // Monta a lista de alternativas dinamicamente
  const options = [
    { key: 'a', text: question.option_a },
    { key: 'b', text: question.option_b },
    { key: 'c', text: question.option_c },
    { key: 'd', text: question.option_d },
    ...(question.option_e ? [{ key: 'e', text: question.option_e }] : [])
  ]

  async function handleAnswer(optionKey: string) {
    // Não permite trocar a resposta depois de enviar
    if (result || loading) return

    setSelected(optionKey)
    setLoading(true)

    try {
      const res = await api.post('/answers', {
        question_id: question.id,
        selected_answer: optionKey
      })
      setResult(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Define a cor de cada alternativa após a resposta
  function getOptionStyle(key: string): string {
    const base = "w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors "

    if (!result) {
      // Antes de responder
      if (selected === key) {
        return base + "border-blue-400 bg-blue-50 text-blue-800"
      }
      return base + "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700"
    }

    // Após responder: mostra certa e errada
    if (key === result.correct_answer) {
      return base + "border-green-400 bg-green-50 text-green-800 font-medium"
    }
    if (key === result.selected_answer && !result.is_correct) {
      return base + "border-red-400 bg-red-50 text-red-800"
    }
    return base + "border-gray-200 bg-gray-50 text-gray-400"
  }

  return (
    // Overlay escuro atrás do modal
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        // Fecha ao clicar fora do modal
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Cabeçalho */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex gap-2">
            <span className="text-xs px-2 py-1 bg-blue-50 text-blue-700 rounded-full">
              {question.discipline.name}
            </span>
            <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
              {DIFFICULTY_LABELS[question.difficulty]}
            </span>
            {question.year && (
              <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full">
                {question.year}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Enunciado */}
        <div className="p-6 pb-4">
          <p className="text-gray-800 text-base leading-relaxed">
            {question.statement}
          </p>
        </div>

        {/* Alternativas */}
        <div className="px-6 space-y-2">
          {options.map(option => (
            <button
              key={option.key}
              onClick={() => handleAnswer(option.key)}
              disabled={!!result || loading}
              className={getOptionStyle(option.key)}
            >
              <span className="font-semibold uppercase mr-3">{option.key})</span>
              {option.text}
            </button>
          ))}
        </div>

        {/* Resultado */}
        {loading && (
          <div className="mx-6 mt-4 p-3 rounded-lg bg-gray-50 text-gray-500 text-sm text-center">
            Corrigindo...
          </div>
        )}

        {result && (
          <div className={`mx-6 mt-4 p-4 rounded-xl border ${
            result.is_correct
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <p className={`font-semibold text-sm mb-1 ${
              result.is_correct ? 'text-green-700' : 'text-red-700'
            }`}>
              {result.is_correct ? '✓ Resposta correta!' : '✗ Resposta incorreta'}
            </p>
            {!result.is_correct && (
              <p className="text-sm text-gray-700 mb-2">
                A alternativa correta é <strong className="uppercase">{result.correct_answer}</strong>
              </p>
            )}
            {result.explanation && (
              <p className="text-sm text-gray-600 leading-relaxed border-t border-gray-200 pt-2 mt-2">
                {result.explanation}
              </p>
            )}
          </div>
        )}

        {/* Rodapé */}
        <div className="p-6 pt-4 flex justify-end gap-3">
          {result && (
            <button
              onClick={() => {
                setSelected(null)
                setResult(null)
              }}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300
                         rounded-lg hover:bg-gray-50 transition-colors"
            >
              Ver questão novamente
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm bg-blue-600 text-white
                       rounded-lg hover:bg-blue-700 transition-colors"
          >
            {result ? 'Próxima questão' : 'Fechar'}
          </button>
        </div>
      </div>
    </div>
  )
}