import assert from 'node:assert/strict'
import test from 'node:test'
import { validateRegistration } from '../src/features/registration/validation.ts'
import { sampleGrades } from '../src/features/curriculum/data/sampleCurriculum.ts'

const valid = {
  fullName: 'Alex Student',
  email: 'alex@example.com',
  password: 'test-only-password',
  grade: sampleGrades[0].id,
}
test('registration requires all fields and accepts all shared grade IDs', () => {
  assert.deepEqual(
    Object.keys(
      validateRegistration({ fullName: '', email: '', password: '', grade: '' }, sampleGrades),
    ),
    ['fullName', 'email', 'password', 'grade'],
  )
  for (const grade of sampleGrades)
    assert.deepEqual(validateRegistration({ ...valid, grade: grade.id }, sampleGrades), {})
  assert.ok(validateRegistration({ ...valid, grade: 'unknown' }, sampleGrades).grade)
})
test('registration checks email and password boundaries without mutating entries', () => {
  for (const email of ['alex', 'alex@', 'a b@example.com', 'a@@example.com'])
    assert.ok(validateRegistration({ ...valid, email }, sampleGrades).email)
  for (const password of ['short', '        ', 'x'.repeat(129)])
    assert.ok(validateRegistration({ ...valid, password }, sampleGrades).password)
  for (const password of ['x'.repeat(8), 'x'.repeat(128)])
    assert.deepEqual(validateRegistration({ ...valid, password }, sampleGrades), {})
  assert.ok(validateRegistration({ ...valid, fullName: 'x' }, sampleGrades).fullName)
  assert.deepEqual(validateRegistration(Object.freeze(valid), sampleGrades), {})
})
