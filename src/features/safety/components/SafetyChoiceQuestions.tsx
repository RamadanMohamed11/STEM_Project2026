import { useId, useState, type FormEvent } from 'react'
import { CheckCircle2, RotateCcw, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import {
  emergencyScenarios,
  isCorrectChoice,
  safetyCheckQuestions,
  scoreChoices,
  type SafetyChoiceQuestion,
} from '../data/labReadiness'

type Answers = Readonly<Record<string, string | undefined>>

function ChoiceFieldset({
  question,
  selected,
  revealed,
  onSelect,
}: {
  question: SafetyChoiceQuestion
  selected: string | undefined
  revealed: boolean
  onSelect: (optionId: string) => void
}) {
  const prefix = useId()
  const correct = isCorrectChoice(question, selected)
  return (
    <fieldset
      aria-describedby={revealed ? `${prefix}-feedback` : undefined}
      className="rounded-xl border border-line bg-white p-5 shadow-card sm:p-6"
    >
      <legend className="sr-only">{question.title}</legend>
      <p className="text-xs font-semibold uppercase tracking-widest text-teal" aria-hidden="true">
        {question.title}
      </p>
      <p className="mt-1.5 text-base font-semibold leading-snug text-navy">{question.prompt}</p>
      <ul className="mt-4 space-y-2">
        {question.options.map((option) => {
          const isSelected = selected === option.id
          const isAnswer = option.id === question.correctOptionId
          const tone = !revealed
            ? isSelected
              ? 'border-teal bg-teal-soft'
              : 'border-line hover:border-teal'
            : isAnswer
              ? 'border-success bg-teal-soft'
              : isSelected
                ? 'border-danger bg-white'
                : 'border-line'
          return (
            <li key={option.id}>
              <label
                className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm leading-relaxed text-ink transition-colors ${tone}`}
              >
                <input
                  type="radio"
                  name={`${prefix}-${question.id}`}
                  value={option.id}
                  checked={isSelected}
                  onChange={() => onSelect(option.id)}
                  className="mt-0.5 size-5 shrink-0 cursor-pointer accent-teal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal"
                />
                <span>{option.text}</span>
              </label>
            </li>
          )
        })}
      </ul>
      <div id={`${prefix}-feedback`} aria-live="polite">
        {revealed && selected !== undefined && (
          <p
            className={`mt-4 flex items-start gap-2 text-sm leading-relaxed ${
              correct ? 'text-success' : 'text-danger'
            }`}
          >
            {correct ? (
              <CheckCircle2 size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
            ) : (
              <XCircle size={17} className="mt-0.5 shrink-0" aria-hidden="true" />
            )}
            <span>
              <span className="font-semibold">{correct ? 'Correct. ' : 'Not quite. '}</span>
              <span className="text-ink">{question.explanation}</span>
            </span>
          </p>
        )}
      </div>
    </fieldset>
  )
}

/** Emergency scenarios give instant feedback; they are practice and never block progress. */
export function EmergencyScenarios() {
  const [answers, setAnswers] = useState<Answers>({})
  const { correct, total } = scoreChoices(emergencyScenarios, answers)
  return (
    <div>
      <p role="status" className="mb-4 text-sm font-medium text-teal-dark">
        {correct} of {total} scenarios handled safely
      </p>
      <div className="grid gap-4 lg:grid-cols-2">
        {emergencyScenarios.map((scenario) => (
          <ChoiceFieldset
            key={scenario.id}
            question={scenario}
            selected={answers[scenario.id]}
            revealed={answers[scenario.id] !== undefined}
            onSelect={(optionId) => setAnswers((prev) => ({ ...prev, [scenario.id]: optionId }))}
          />
        ))}
      </div>
    </div>
  )
}

/** Three-question understanding check; all answers must be correct before continuing. */
export function SafetyQuickCheck({
  onPassedChange,
}: {
  onPassedChange?: (passed: boolean) => void
}) {
  const [answers, setAnswers] = useState<Answers>({})
  const [submitted, setSubmitted] = useState(false)
  const prefix = useId()
  const score = scoreChoices(safetyCheckQuestions, answers)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitted(true)
    onPassedChange?.(score.passed)
  }

  function reset() {
    setAnswers({})
    setSubmitted(false)
    onPassedChange?.(false)
  }

  return (
    <form noValidate onSubmit={submit} aria-describedby={`${prefix}-result`}>
      <div className="space-y-4">
        {safetyCheckQuestions.map((question) => (
          <ChoiceFieldset
            key={question.id}
            question={question}
            selected={answers[question.id]}
            revealed={submitted}
            onSelect={(optionId) => {
              setAnswers((prev) => ({ ...prev, [question.id]: optionId }))
              if (submitted) {
                setSubmitted(false)
                onPassedChange?.(false)
              }
            }}
          />
        ))}
      </div>
      <div id={`${prefix}-result`} role="status" className="mt-5 text-sm leading-relaxed">
        {submitted &&
          (score.passed ? (
            <p className="rounded-lg border border-success/30 bg-teal-soft px-4 py-3 font-semibold text-success">
              {score.correct} of {score.total} correct. Well done — you can continue.
            </p>
          ) : (
            <p className="rounded-lg border border-danger/30 bg-white px-4 py-3 font-semibold text-danger">
              {score.correct} of {score.total} correct
              {score.answered < score.total ? ` (${score.total - score.answered} unanswered)` : ''}.
              Review the explanations, change your answers and check again.
            </p>
          ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button type="submit">Check my answers</Button>
        <Button variant="ghost" icon={<RotateCcw size={15} aria-hidden="true" />} onClick={reset}>
          Reset
        </Button>
      </div>
    </form>
  )
}
