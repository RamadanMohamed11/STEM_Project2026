# Student Login Page (Task T08)

## Overview

Task T08 implements a student login page for **STEM Virtual Lab**. The page features a validation-only form aligned with the application's responsive visual identity and English language foundation. It prepares the interface for future authentication while ensuring no fake logged-in sessions or unauthorized redirects occur during the prototype phase.

## 1. Architectural Structure

```
src/
├── features/
│   └── auth/
│       ├── types.ts          # LoginValues, LoginErrors, AuthService interface
│       ├── validation.ts     # Pure validation logic (validateLogin)
│       └── LoginForm.tsx      # Form component with inputs, toggle, status notices
└── pages/
    └── LoginPage.tsx         # Page wrapper with title, eyebrow, and card layout
```

### Decoupling and Future Authentication
- **Validation:** Independent pure function (`validateLogin`) decoupled from UI and framework logic.
- **Future Auth Service:** Defined via `AuthService` contract in `types.ts`. When an authentication backend is connected, it will be injected without modifying form markup or validation rules.
- **No Fake Auth:** When inputs pass validation, a clear status message confirms entry validity without creating fake session tokens, writing to storage, or redirecting to protected routes.

## 2. Form Controls & Behaviors

| Control | Attributes / Behavior | Accessibility |
|:---|:---|:---|
| **Email** | `type="email"`, `name="email"`, `autoComplete="email"` | `aria-invalid`, `aria-describedby="email-error"`, `(required)` |
| **Password** | `type={visible ? 'text' : 'password'}`, `autoComplete="current-password"` | `aria-invalid`, `aria-describedby="password-error"`, `(required)` |
| **Show/Hide** | Toggle button positioned within password field container | `aria-controls="password"`, `aria-pressed`, `aria-label` |
| **Forgot Password** | Inline trigger displaying non-blocking prototype notice | `role="status"`, contextual guidance |
| **Log In Button** | `type="submit"`, disabled once checked until field edits | High-contrast focus outline, min 48px touch target |
| **Create Account** | Navigation link pointing to `/signup` | Accessible link with hover and focus states |
| **Review Safety** | Secondary navigation link pointing to `/safety` | Seamless continuity through the learning journey |

## 3. Validation Rules

1. **Email:**
   - Required: Returns `"Enter your email."` if empty or whitespace only.
   - Format: Must match `^[^\s@]+@[^\s@]+\.[^\s@]+$` and not exceed 254 characters; otherwise returns `"Enter a valid email address."`.
2. **Password:**
   - Required: Returns `"Enter your password."` if empty.
   - Length: Must be between 8 and 128 characters without consisting solely of whitespace; otherwise returns `"Use 8 to 128 characters for your password."`.
3. **Immutability:** Inputs are validated without mutating source objects (verified with `Object.freeze`).

## 4. Verification

- **TypeScript (`tsc -b --pretty`):** Clean compilation, 0 errors.
- **ESLint (`eslint .`):** Clean linting, 0 warnings/errors.
- **Node Test Runner (`npm test`):** 197 passing tests across all test suites, including dedicated `tests/login.test.mjs`.
- **Production Build (`npm run build`):** Clean Vite bundle generation in ~1.00s.
