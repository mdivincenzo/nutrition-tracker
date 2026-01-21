# CLAUDE.md - Macro Nutrition App

## Project Overview

Macro is a Next.js 14 nutrition tracking app with AI-powered onboarding. Users complete a conversational onboarding flow to generate personalized macro targets, then sign up to save their profile and access the dashboard.

## Current Work

<!-- Update this section when starting a new feature or debugging session -->
_None currently_

---

## Design System

### Visual Identity
- **Theme:** Dark mode only, near-black background with subtle transparency layers
- **Aesthetic:** Modern, minimal, premium feel with glowing accents and floating elements
- **Font:** Inter (via next/font/google)

### Color Tokens (CSS Variables)
```css
--accent-violet: #8b5cf6      /* Primary accent - buttons, links, glows */
--accent-pink: [gradient end]  /* Used in gradient-text */
--text-primary: #f8fafc        /* Main text - white */
--text-secondary: #94a3b8      /* Muted text - gray */
--text-tertiary: #64748b       /* Subtle text - darker gray */
--surface: rgba(255,255,255,0.03)        /* Card backgrounds */
--surface-hover: rgba(255,255,255,0.06)  /* Hover states */
--surface-border: rgba(255,255,255,0.08) /* Subtle borders */
--success: #34d399             /* Green */
--error: #f87171               /* Red */
```

### Component Patterns

**Inputs:**
- Dark background (`rgba(10, 10, 15, 0.95)`)
- Rounded corners (`border-radius: 14px`)
- Purple glow effect on focus
- No visible border, uses glow for definition

**Buttons:**
- Rounded (`border-radius: 12px`)
- Primary: Filled violet background
- Secondary/Chips: Transparent with border, `border-surface-border`

**Goal Chips:**
- Pill-shaped with emoji prefix
- Border style, not filled
- Hover changes border/text to accent color

**Cards/Surfaces:**
- Use `--surface` background
- `--surface-border` for borders
- Subtle hover states with `--surface-hover`

### Decorative Elements
- **Floating Orbs:** Large blurred circles (`floating-orb` class) with `animate-float`
- **Gradient Text:** `.gradient-text` class for purple-to-pink headlines
- **Glow Effects:** Purple box-shadow on focused inputs

### Layout Patterns
- Max content width: `max-w-3xl` or `max-w-4xl`
- Header: Sticky with `border-surface-border` bottom border
- Main content: Centered, often with negative margin to account for header

---

## Code Conventions

### File Organization
```
app/
  page.tsx          # Route pages
  layout.tsx        # Layouts
  api/              # API routes
components/
  ComponentName.tsx # PascalCase, one component per file
lib/
  util-name.ts      # Utility functions, kebab-case files
  supabase.ts       # Client instances
```

### Naming
- **Components:** PascalCase (`OnboardingChat.tsx`)
- **Utilities:** camelCase functions, kebab-case files
- **Constants:** SCREAMING_SNAKE_CASE (`STORAGE_KEY`)
- **CSS Variables:** kebab-case with category prefix (`--text-primary`, `--surface-border`)

### State Management
- Local state with `useState` for component-specific data
- `sessionStorage` for onboarding data persistence (key: `onboarding_profile`)
- Cookies for cross-page data (OAuth name, auth source)
- Supabase for persistent user data

### Patterns to Follow
- Use `'use client'` directive for client components
- Destructure hooks: `const { showToast } = useToast()`
- Early returns for loading/error states
- Tailwind for styling, avoid inline styles
- Use CSS variables via Tailwind (`text-text-secondary`, `border-surface-border`)

### Patterns to Avoid
- Don't mix server and client code in same file
- Don't store sensitive data in sessionStorage/cookies
- Don't use `any` type - define interfaces
- Don't write useEffects that trigger on mount AND dependency changes without guards

---

## Domain Concepts

### Nutrition Calculations
- **BMR (Basal Metabolic Rate):** Calories burned at rest, calculated from age, sex, height, weight
- **TDEE (Total Daily Energy Expenditure):** BMR × activity multiplier
- **Macros:** Protein, carbs, fat targets in grams
  - Protein: Usually 0.8-1g per pound of body weight for muscle building
  - Remaining calories split between carbs and fat based on preference

### Goal Types
- **Lose fat:** Caloric deficit (TDEE - 300-500 cal)
- **Build muscle:** Caloric surplus (TDEE + 200-300 cal)
- **Get fit/maintain:** Around TDEE

### Activity Levels
- Sedentary: ×1.2
- Lightly active: ×1.375
- Moderately active: ×1.55
- Very active: ×1.725
- Extremely active: ×1.9

---

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Auth & Database:** Supabase (auth + Postgres)
- **Styling:** Tailwind CSS
- **AI:** Claude API for onboarding chat
- **Language:** TypeScript

## Key File Locations

| File | Purpose |
|------|---------|
| `app/page.tsx` | Root page - handles onboarding flow, auth state checks, sessionStorage management |
| `app/signup/page.tsx` | Email signup + Google OAuth initiation |
| `app/login/page.tsx` | Email login + Google OAuth initiation |
| `app/api/auth/callback/route.ts` | OAuth callback - exchanges code, sets cookies, redirects |
| `app/dashboard/page.tsx` | Main app after successful signup |
| `middleware.ts` | Protects routes, redirects based on auth + profile state |
| `components/OnboardingChat.tsx` | AI chat that collects user info via tool calls |
| `components/PlanPreview.tsx` | Shows generated macro plan, has "Start Your Journey" CTA |
| `lib/onboarding-tools.ts` | Contains `saveOnboardingProfile()` and onboarding tool definitions |
| `lib/supabase.ts` | Client-side Supabase client |
| `lib/supabase-server.ts` | Server-side Supabase client |
| `components/Providers.tsx` | Client providers (ToastProvider) |

## Data Flow

### Onboarding Data Storage
- **sessionStorage key:** `onboarding_profile`
- **Cookie:** `onboarding_name` (OAuth first name, temporary)
- **Cookie:** `auth_source` (login vs signup, for toast messaging)

### Profile Schema (Supabase `profiles` table)
Required fields for "complete" profile:
- `user_id` - Links to Supabase auth user
- `name` - User's name
- `daily_calories` - Calculated calorie target
- `daily_protein` - Calculated protein target

Optional fields:
- `height_inches`, `start_weight`, `goal_weight`
- `daily_carbs`, `daily_fat`
- `start_date`, `coaching_notes`

## Auth Flows

### New User: Onboarding → Signup → Dashboard
1. User visits `/` (root)
2. Enters goal, completes AI onboarding chat
3. Profile data saved to sessionStorage
4. Sees PlanPreview with macro targets
5. Clicks "Start Your Journey" → `/signup`
6. Signs up (email or Google OAuth)
7. Profile saved to DB from sessionStorage
8. Redirected to `/dashboard`

### Google OAuth Flow
1. User clicks "Continue with Google" on signup
2. Redirects to Google
3. Google redirects to `/api/auth/callback?auth_source=signup`
4. Callback exchanges code, sets `onboarding_name` cookie
5. Redirects to `/dashboard`
6. Middleware checks profile → not found → redirects to `/`
7. Root page merges cookie name, saves profile, redirects to dashboard

### Returning User: Login → Dashboard
1. User visits `/login`
2. Logs in (email or Google)
3. If profile exists → `/dashboard`
4. If no profile → `/` for onboarding

## Middleware Logic (`middleware.ts`)

```
- /dashboard without auth → redirect to /login
- /dashboard with auth but no profile → redirect to /
- /login or /signup with auth AND complete profile → redirect to /dashboard
```

## Common Patterns

### Checking for Complete Profile
```typescript
const isComplete = profile?.name && profile?.daily_calories
```

### Reading Cookies Client-Side
```typescript
const cookies = document.cookie.split(';')
const nameCookie = cookies.find((c) => c.trim().startsWith('onboarding_name='))
```

### Saving Profile to Supabase
```typescript
import { saveOnboardingProfile } from '@/lib/onboarding-tools'
const result = await saveOnboardingProfile(profile, user.id, supabase)
```

## Known Issues & Recent Fixes

### Fixed: sessionStorage Race Condition
The save useEffect was overwriting sessionStorage on initial mount before the load effect could read existing data. Fixed by adding `isInitialMount` ref to skip first render.

### Watch For: OAuth Cookie Issues
The `onboarding_name` cookie sometimes doesn't get set properly. Check:
- Cookie path is `/`
- Cookie is being set before redirect
- SameSite attribute allows cross-origin

### Watch For: Middleware Timing
Middleware runs server-side before client code. If profile needs to be saved client-side first, consider redirecting OAuth callback to `/` instead of `/dashboard`.

## Commands

```bash
# Dev server
npm run dev

# Type checking
npm run typecheck

# Linting
npm run lint
```

## Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
```

## Debug Logging

Auth debugging logs in `app/page.tsx`:
- `[Auth Debug] sessionStorage profile:` - Raw sessionStorage value
- `[Auth Debug] Parsed profile - name/calories/protein` - Field values
- `[Auth Debug] Save result:` - Result of saveOnboardingProfile()

---

## Do's and Don'ts

### Do
- ✅ Use the existing CSS variables for colors (don't hardcode hex values)
- ✅ Follow the existing component patterns (check similar components first)
- ✅ Add `isInitialMount` guards when useEffect writes to storage on mount
- ✅ Use `router.replace()` for auth redirects (not `push`)
- ✅ Clear cookies after reading them (one-time use)
- ✅ Check for both `name` AND `daily_calories` when verifying profile completeness
- ✅ Log auth flow issues with `[Auth Debug]` prefix for consistency

### Don't
- ❌ Don't create new color values - use existing CSS variables
- ❌ Don't use localStorage (we use sessionStorage for onboarding, Supabase for persistence)
- ❌ Don't skip the loading state check (`isCheckingAuth`)
- ❌ Don't assume sessionStorage persists across OAuth redirects (it might not)
- ❌ Don't modify middleware redirect logic without understanding all three auth flows
- ❌ Don't add dependencies to useEffect without considering if it should run on every change
