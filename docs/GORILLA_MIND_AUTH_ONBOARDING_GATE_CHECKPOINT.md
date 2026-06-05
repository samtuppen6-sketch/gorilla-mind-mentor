# Gorilla Mind — Auth + Onboarding Gate Stability Checkpoint

Status: STABLE — do not regress.

Related checkpoints:
- docs/GORILLA_MIND_COACH_STABLE_CHECKPOINT.md
- docs/GORILLA_MIND_ONBOARDING_PROFILE_CHECKPOINT.md

---

## 1. Current User Entry Flow

| State | Route |
|---|---|
| Fresh open (no identityProfile) | `/auth` |
| Auth complete, onboarding incomplete | `/onboarding` |
| Onboarding complete | `/coach` |
| Returning complete user | `/coach` |
| Returning incomplete user | `/onboarding` |

All routing decisions go through a single source of truth:
`getUserEntryRoute(profile)` in `src/lib/profile-store.ts`.

### `getUserEntryRoute(profile)` behaviour

| Condition | Returns |
|---|---|
| No `identityProfile` | `/auth` |
| `identityProfile` present, `onboardingComplete === false` | `/onboarding` |
| `identityProfile` present, `onboardingComplete === true` | `/coach` |

Gates are applied at mount via `useEffect` on `/`, `/coach`, and `/onboarding`.
No render-time redirects. No route re-entry loops.

---

## 2. Current Auth Status

- Email path: works locally (creates identityProfile in `localStorage`).
- Google button: placeholder — shows "coming soon" toast, no OAuth call.
- Apple button: placeholder — shows "coming soon" toast, no OAuth call.
- Persistence: `localStorage` only (`gorillaMindProfile`).
- No real Supabase Auth yet. No server-side session.

---

## 3. IdentityProfile Fields

Stored under `profile.identityProfile`:

- `userId`
- `firstName`
- `lastName`
- `fullName`
- `email`
- `phoneNumber`
- `authProvider` (`email` | `google` | `apple`)
- `onboardingComplete`
- `createdAt`
- `updatedAt`

---

## 4. Notification Readiness

Scaffolding only — no permission prompt is requested yet.

`notificationProfile` fields:
- `pushEnabled` (default `false`)
- `pushToken` (default `null`)
- `deviceToken` (default `null`)
- `platform` (default `null`)
- `permissionStatus` (default `"unknown"`)

`reminderPreferences` defaults:
- `morningProtocol`: enabled, default time `08:00`
- `eveningCheckIn`: enabled, default time `21:00`
- `streakProtection`: enabled
- `workoutReminders`: enabled
- `quietHours`: `22:00`–`07:00`

Future push-token / device-token registration path is reserved on the profile
shape so it can be wired without a migration.

---

## 5. Dev-Only Tools

- Debug mode toggle via `?debug=true` / `?debug=false` (persists in
  `localStorage.gorillaMindDebug`).
- Debug badge shown top-right in `AppShell` only when debug mode is on.
- **Dev reset button** is visible ONLY in debug mode.
  - Clears `localStorage` profile + journal.
  - Returns user to `/auth`.
- Debug payloads still computed internally regardless of UI visibility.

---

## 6. Tests Passed

| Test | Status |
|---|---|
| Fresh user gate → `/auth` | PASS |
| Email signup → `/onboarding` | PASS |
| Refresh mid-onboarding stays on `/onboarding` | PASS |
| Onboarding completion → `/coach` | PASS |
| Refresh after onboarding stays on `/coach` | PASS |
| Navigate to `/onboarding` after completion → bounce to `/coach` | PASS |
| Google/Apple placeholder safety (no crash, toast only) | PASS |
| `notificationProfile` defaults present, no permission prompt | PASS |

---

## 7. Remaining TODOs

- Supabase email/password auth (replace local email path)
- Google OAuth (real provider)
- Apple OAuth (real provider)
- Supabase `profiles` table
- RLS policies on `profiles` and related tables
- `user_roles` table + `has_role()` security-definer function
- Server-side profile/progress persistence (mirror local → Supabase)
- Push notification registration flow (request permission, store token)
- Country / timezone enrichment server-side

---

## 8. Warnings for Future Edits

- **Do NOT break `getUserEntryRoute`.** It is the single source of truth.
- **Do NOT reintroduce render-time redirects.** Gates run in `useEffect` only.
- **Do NOT request notification permission** until the push flow is intentionally built.
- **Do NOT expose the Dev reset button outside debug mode.**
- Do not weaken auth/onboarding gates to "fix" a flow — fix the profile state instead.
- Do not store roles on `identityProfile` — roles belong in a separate `user_roles` table.
