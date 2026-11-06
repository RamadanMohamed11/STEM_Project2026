import assert from 'node:assert/strict'
import test from 'node:test'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { MemoryRouter } from 'react-router'
import { createServer } from 'vite'
import { validateLogin } from '../src/features/auth/validation.ts'

const validCredentials = {
  email: 'student@example.com',
  password: 'valid-password-123',
}

test('login requires email and password and returns clear error messages', () => {
  const emptyErrors = validateLogin({ email: '', password: '' })
  assert.equal(emptyErrors.email, 'Enter your email.')
  assert.equal(emptyErrors.password, 'Enter your password.')

  const whitespaceErrors = validateLogin({ email: '   ', password: '' })
  assert.equal(whitespaceErrors.email, 'Enter your email.')

  const validResult = validateLogin(validCredentials)
  assert.deepEqual(validResult, {})
})

test('login checks email formatting and boundary constraints without mutating input', () => {
  for (const email of ['student', 'student@', 'stu dent@example.com', 'student@@example.com']) {
    const error = validateLogin({ ...validCredentials, email }).email
    assert.equal(error, 'Enter a valid email address.', `Expected error for ${email}`)
  }

  // Overlong email (> 254 chars)
  const longEmail = `${'a'.repeat(250)}@example.com`
  assert.equal(
    validateLogin({ ...validCredentials, email: longEmail }).email,
    'Enter a valid email address.',
  )

  // Immutability check
  assert.deepEqual(validateLogin(Object.freeze(validCredentials)), {})
})

test('login checks password length and whitespace boundaries', () => {
  // Too short
  for (const password of ['123', 'short', 'sevench']) {
    assert.equal(
      validateLogin({ ...validCredentials, password }).password,
      'Use 8 to 128 characters for your password.',
    )
  }

  // Whitespace only
  assert.equal(
    validateLogin({ ...validCredentials, password: '        ' }).password,
    'Use 8 to 128 characters for your password.',
  )

  // Over 128 characters
  assert.equal(
    validateLogin({ ...validCredentials, password: 'x'.repeat(129) }).password,
    'Use 8 to 128 characters for your password.',
  )

  // Valid boundary lengths (8 and 128)
  assert.deepEqual(validateLogin({ ...validCredentials, password: 'x'.repeat(8) }), {})
  assert.deepEqual(validateLogin({ ...validCredentials, password: 'x'.repeat(128) }), {})
})

test('student login page renders accessible form with show/hide control, clear labels, and prototype notice', async () => {
  const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
  try {
    const { AppRoutes } = await vite.ssrLoadModule('/src/app/routes.tsx')
    const markup = renderToStaticMarkup(
      React.createElement(
        MemoryRouter,
        { initialEntries: ['/login'] },
        React.createElement(AppRoutes),
      ),
    )

    // Landmarks and headings
    assert.ok(markup.includes('Welcome Back'), 'Page title Welcome Back')
    assert.ok(markup.includes('STEM Virtual Lab · Login'), 'Eyebrow')
    assert.ok(markup.includes('aria-label="Student login"'), 'Accessible form landmark')

    // Email field with autocomplete
    assert.ok(markup.includes('id="email"'), 'Email input')
    assert.ok(markup.includes('type="email"'), 'Email type')
    assert.match(markup, /autocomplete="email"/i, 'Email autocomplete')

    // Password field with autocomplete
    assert.ok(markup.includes('id="password"'), 'Password input')
    assert.ok(markup.includes('type="password"'), 'Password type')
    assert.match(markup, /autocomplete="current-password"/i, 'Password autocomplete')

    // Show/Hide password toggle
    assert.ok(markup.includes('aria-controls="password"'), 'Show/hide password control')
    assert.ok(markup.includes('Show password'), 'Show password aria-label')

    // Actions & Navigation links
    assert.ok(markup.includes('Log In'), 'Log In button')
    assert.ok(markup.includes('Forgot Password?'), 'Forgot password link')
    assert.ok(markup.includes('href="/signup"'), 'Link to sign up')
    assert.ok(markup.includes('Create Account'), 'Create account text')
    assert.ok(markup.includes('href="/safety"'), 'Link to review safety')

    // Prototype messaging
    assert.ok(markup.includes('Login is coming soon'), 'Prototype title')
    assert.ok(markup.includes('without an account'), 'Without an account note')
    assert.ok(markup.includes('No session will be created'), 'No fake auth promise')

    // English only, no Arabic
    assert.equal(
      /[\u0600-\u06FF]/.test(markup),
      false,
      'Login page must not contain Arabic characters',
    )
  } finally {
    await vite.close()
  }
})
