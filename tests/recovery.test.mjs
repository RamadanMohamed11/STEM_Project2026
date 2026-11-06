import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'
import { validateRecovery, recoveryRequestAcceptedMessage } from '../src/features/auth/recovery.ts'

const values = {
  email: 'student@example.com',
  newPassword: 'test-password',
  confirmPassword: 'test-password',
}
test('recovery validates email and reset password boundaries without changing input', () => {
  assert.deepEqual(validateRecovery('forgot', Object.freeze(values)), {})
  for (const email of ['', '  ', 'a', 'a@@b.com', 'a b@example.com', 'x'.repeat(255) + '@a.com'])
    assert.ok(validateRecovery('forgot', { ...values, email }).email)
  for (const newPassword of ['', 'short', '        ', 'x'.repeat(129)])
    assert.ok(validateRecovery('reset', { ...values, newPassword }).newPassword)
  for (const newPassword of ['x'.repeat(8), 'x'.repeat(128)])
    assert.deepEqual(
      validateRecovery('reset', { ...values, newPassword, confirmPassword: newPassword }),
      {},
    )
  assert.equal(
    validateRecovery('reset', { ...values, confirmPassword: '' }).confirmPassword,
    'Confirm your new password.',
  )
  assert.equal(
    validateRecovery('reset', { ...values, confirmPassword: 'different' }).confirmPassword,
    'Passwords do not match.',
  )
  assert.match(recoveryRequestAcceptedMessage, /^If an account/)
})

test('recovery routes render independently of tokens and login sessions; feedback states are accessible', async () => {
  const vite = await createServer({
    server: { middlewareMode: true, hmr: false },
    appType: 'custom',
  })
  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')
    const renderRoute = (path) =>
      renderToStaticMarkup(
        React.createElement(
          MemoryRouter,
          { initialEntries: [path] },
          React.createElement(AppRoutes),
        ),
      )
    const forgot = renderRoute('/forgot-password')
    const reset = renderRoute('/reset-password')
    assert.match(forgot, /Forgot Your Password\?/)
    assert.match(forgot, /No reset email will be sent/)
    assert.match(forgot, /type="email"/)
    assert.match(reset, /Confirm New Password/)
    assert.match(reset, /No password will be changed/)
    assert.match(reset, /autoComplete="new-password"/i)
    assert.match(reset, /Show new password/)
    for (const markup of [forgot, reset]) {
      assert.match(markup, /href="\/login"/)
      assert.match(markup, /noValidate/i)
      assert.doesNotMatch(
        markup,
        /If an account uses this email|Password changed successfully|Immersive laboratory workspace/,
      )
    }
    assert.match(renderRoute('/login'), /href="\/forgot-password"/)
    assert.match(renderRoute('/reset-password?token=untrusted'), /No password will be changed/)
    const { RecoveryForm } = await vite.ssrLoadModule('/src/features/auth/RecoveryForm.tsx')
    const checking = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        null,
        React.createElement(RecoveryForm, { mode: 'reset', availability: 'checking' }),
      ),
    )
    assert.match(checking, /aria-busy="true"/)
    assert.match(checking, /<fieldset disabled/)
    assert.match(checking, /Please wait/)
    const { AuthFeedback, AuthFieldError } = await vite.ssrLoadModule(
      '/src/features/auth/components/AuthFeedback.tsx',
    )
    assert.match(
      renderToStaticMarkup(React.createElement(AuthFeedback, { kind: 'error' }, 'Unavailable')),
      /role="alert"/,
    )
    assert.match(
      renderToStaticMarkup(
        React.createElement(AuthFeedback, { kind: 'success' }, 'Confirmed provider response'),
      ),
      /role="status"/,
    )
    assert.equal(renderToStaticMarkup(React.createElement(AuthFieldError, { id: 'error' })), '')
  } finally {
    await vite.close()
  }
})
