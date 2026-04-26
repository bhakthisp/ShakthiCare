import { useEffect, useMemo, useState } from 'react'

type Answer = { answer_text: string; timestamp: number }
type Question = {
  id: string
  question_text: string
  timestamp: number
  answers: Answer[]
}

const STORAGE_KEY = 'shakticare_community_qa_v1'

function safeParseQuestions(raw: string | null): Question[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((q) => q && typeof q === 'object')
      .map((q) => {
        const qq = q as Partial<Question>
        return {
          id: typeof qq.id === 'string' ? qq.id : crypto.randomUUID(),
          question_text: typeof qq.question_text === 'string' ? qq.question_text : '',
          timestamp: typeof qq.timestamp === 'number' ? qq.timestamp : Date.now(),
          answers: Array.isArray(qq.answers)
            ? qq.answers
                .filter((a) => a && typeof a === 'object')
                .map((a) => ({
                  answer_text:
                    typeof (a as { answer_text?: unknown }).answer_text === 'string'
                      ? String((a as { answer_text?: unknown }).answer_text)
                      : '',
                  timestamp:
                    typeof (a as { timestamp?: unknown }).timestamp === 'number'
                      ? Number((a as { timestamp?: unknown }).timestamp)
                      : Date.now(),
                }))
                .filter((a) => a.answer_text.trim().length > 0)
            : [],
        }
      })
      .filter((q) => q.question_text.trim().length > 0)
  } catch {
    return []
  }
}

function formatTime(ts: number) {
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ''
  }
}

export function CommunityPage() {
  const [questions, setQuestions] = useState<Question[]>(() =>
    safeParseQuestions(localStorage.getItem(STORAGE_KEY)),
  )
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const [newQuestion, setNewQuestion] = useState('')
  const [answerDraftById, setAnswerDraftById] = useState<Record<string, string>>({})

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(questions))
  }, [questions])

  const sorted = useMemo(() => {
    return [...questions].sort((a, b) => b.timestamp - a.timestamp)
  }, [questions])

  return (
    <div className="glass-card p-6 md:p-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-gray-800 md:text-4xl">
          Anonymous Community Q&amp;A
        </h1>
        <p className="max-w-3xl text-sm text-gray-700">
          A safe space for women helping women — ask questions anonymously and share supportive answers.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-white/30 bg-white/35 p-5 shadow-xl backdrop-blur-lg">
        <div className="text-sm font-semibold text-gray-700">Ask a question</div>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Type your question anonymously…"
            className="input-glass flex-1"
          />
          <button
            type="button"
            className="btn-grad h-11 px-6"
            onClick={() => {
              const text = newQuestion.trim()
              if (!text) return
              const q: Question = {
                id: crypto.randomUUID(),
                question_text: text,
                timestamp: Date.now(),
                answers: [],
              }
              setQuestions((prev) => [q, ...prev])
              setNewQuestion('')
              setExpandedId(q.id)
            }}
          >
            Ask Anonymously
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-600">
          No names. No profiles. Just anonymous support.
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {sorted.length === 0 ? (
          <div className="rounded-2xl border border-white/30 bg-white/25 p-6 text-sm text-gray-700 backdrop-blur-lg">
            No questions yet. Be the first to ask anonymously.
          </div>
        ) : (
          sorted.map((q) => {
            const expanded = expandedId === q.id
            return (
              <div
                key={q.id}
                className="rounded-2xl border border-white/30 bg-white/35 p-5 shadow-xl backdrop-blur-lg"
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => setExpandedId((cur) => (cur === q.id ? null : q.id))}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-gray-800">
                        {q.question_text}
                      </div>
                      <div className="mt-1 text-xs text-gray-600">
                        {formatTime(q.timestamp)} • {q.answers.length} answer{q.answers.length === 1 ? '' : 's'}
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-white/70 px-3 py-1 text-[11px] font-bold text-gray-800 ring-1 ring-white/40">
                      {expanded ? 'Hide' : 'Open'}
                    </span>
                  </div>
                </button>

                {expanded ? (
                  <div className="mt-4">
                    <div className="space-y-3">
                      {q.answers.length ? (
                        q.answers
                          .slice()
                          .sort((a, b) => a.timestamp - b.timestamp)
                          .map((a, idx) => (
                            <div
                              key={`${q.id}-a-${idx}`}
                              className="rounded-2xl bg-white/55 p-4 text-sm text-gray-800 ring-1 ring-white/35"
                            >
                              <div className="font-medium">{a.answer_text}</div>
                              <div className="mt-1 text-[11px] text-gray-600">
                                {formatTime(a.timestamp)}
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="rounded-2xl bg-white/30 p-4 text-sm text-gray-700 ring-1 ring-white/25">
                          No answers yet. Be the first to reply.
                        </div>
                      )}
                    </div>

                    <div className="mt-4 rounded-2xl bg-white/30 p-4 ring-1 ring-white/25">
                      <div className="text-xs font-semibold text-gray-700">
                        Add an answer
                      </div>
                      <div className="mt-2 flex flex-col gap-3 sm:flex-row">
                        <input
                          value={answerDraftById[q.id] ?? ''}
                          onChange={(e) =>
                            setAnswerDraftById((prev) => ({
                              ...prev,
                              [q.id]: e.target.value,
                            }))
                          }
                          placeholder="Write a supportive answer…"
                          className="input-glass flex-1"
                        />
                        <button
                          type="button"
                          className="btn-grad h-11 px-6"
                          onClick={() => {
                            const text = (answerDraftById[q.id] ?? '').trim()
                            if (!text) return
                            setQuestions((prev) =>
                              prev.map((qq) =>
                                qq.id !== q.id
                                  ? qq
                                  : {
                                      ...qq,
                                      answers: [
                                        ...qq.answers,
                                        { answer_text: text, timestamp: Date.now() },
                                      ],
                                    },
                              ),
                            )
                            setAnswerDraftById((prev) => ({ ...prev, [q.id]: '' }))
                          }}
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

