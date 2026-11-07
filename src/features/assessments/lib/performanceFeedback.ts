export type PerformanceTier = 'perfect' | 'excellent' | 'good' | 'practice'

export interface PerformanceFeedback {
  tier: PerformanceTier
  title: string
  headline: string
  message: string
  encouragementNote: string
}

/**
 * Returns age-appropriate, encouraging feedback based on the student's actual score percentage.
 * Never uses discouraging, insulting, or overly dramatic language.
 */
export function getPerformanceFeedback(percentage: number): PerformanceFeedback {
  const clamped = Number.isFinite(percentage) ? Math.max(0, Math.min(100, Math.round(percentage))) : 0

  if (clamped === 100) {
    return {
      tier: 'perfect',
      title: 'Excellent Work!',
      headline: 'Perfect score on your practice quiz!',
      message:
        'Outstanding achievement! You answered every question correctly and demonstrated a complete understanding of this experiment’s scientific principles.',
      encouragementNote: 'You have mastered all learning objectives for this experiment. Great scientific reasoning!',
    }
  }

  if (clamped >= 80) {
    return {
      tier: 'excellent',
      title: 'Great Job!',
      headline: 'Strong understanding demonstrated!',
      message:
        'You showed a clear grasp of the laboratory techniques and concepts. Review the detailed feedback below to master every question.',
      encouragementNote: 'Solid performance! Read the explanations for any missed points to deepen your knowledge.',
    }
  }

  if (clamped >= 50) {
    return {
      tier: 'good',
      title: 'Good Effort!',
      headline: 'You are making steady progress!',
      message:
        'You understand several key ideas from the experiment. Review the scientific explanations below to strengthen your understanding.',
      encouragementNote: 'Good scientific effort! Reviewing your answers will help you understand every concept even better.',
    }
  }

  return {
    tier: 'practice',
    title: 'Keep Practicing!',
    headline: 'Learning science takes practice!',
    message:
      'Every experiment and quiz is an opportunity to learn. Take a close look at the explanations below, then try the quiz again.',
    encouragementNote: 'Do not be discouraged! Exploring why each answer works will help you succeed on your next attempt.',
  }
}
