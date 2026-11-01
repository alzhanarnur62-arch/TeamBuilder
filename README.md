# TeamBuilder AI

**English** · [Қазақша](README.kk.md) · [Русский](README.ru.md)

A mobile app that helps university students build balanced project teams. Students describe their skills, interests and free time; project leads publish ideas; the app suggests the most balanced team and **explains every choice**.

Built with Expo (React Native) and Supabase. Runs in **Expo Go** — no native build required. The interface is available in **Kazakh, Russian and English**.

## Features

- **Competency profile** — role, skills, interests, free time slots, photo, achievements.
- **Project ideas** — publish an idea with the roles, skills, meeting times and team size you need. Every project shows how well it matches *you*.
- **Requests and roles** — students apply for a role; the lead accepts or declines and can reassign roles later.
- **Automatic team building** — the app checks every possible line-up and suggests the 3 most balanced teams, with a score, a breakdown and the reasons behind each decision (see below).
- **Tasks and personal contribution** — a task board (to do → in progress → done) with points, plus peer ratings (1–5 ★). A *contribution index* combines both.
- **Chats** — project group chats and direct messages, updated in real time.
- **News (REST API)** — announcements loaded with `fetch` from a public REST API, with loading, error, empty, offline-cache and pull-to-refresh states.
- **Email sign-in with a one-time code** — no passwords; the session is remembered.

## How team building works

`src/utils/matching.ts`

1. Every student gets a personal score against the project (role, skills, free time, interests). The top 12 candidates form the pool.
2. **Every combination** of candidates for the free seats is checked — not just "the best one at a time".
3. Each line-up is scored as a whole:

   | Criterion | Weight |
   |---|---|
   | Role balance (needed roles covered, no duplicates) | 35% |
   | Skill coverage | 30% |
   | Free time shared by everyone | 25% |
   | Shared interests | 10% |

   Students who already belong to another project get a penalty.
4. The best 3 line-ups are shown. Explanations come from "what if" checks: removing a member ("without them the score drops by 16") or swapping a candidate in ("swapping with Damir lowers the score 89 → 81").

The **contribution index** (`src/components/ContributionTab.tsx`) = 60% points from finished tasks + 40% average peer rating.

## Tech stack

- Expo SDK 58, React Native 0.88, React 19, TypeScript
- React Navigation (native stack + bottom tabs)
- Supabase: Auth (email OTP), Postgres with Row Level Security, Realtime, Storage
- expo-image-picker, expo-image-manipulator, expo-localization, AsyncStorage

## Project structure

```
App.tsx                    navigation and app start-up
src/
  api/                     REST API client (news)
  components/              reusable UI (team suggestion, cards, language switcher…)
  context/                 data layer: Supabase data, auth, profile, chats
  i18n/                    translations (kk / ru / en) in one dictionary
  lib/                     Supabase client, avatar upload
  screens/                 app screens
  utils/matching.ts        team-building algorithm
supabase/                  SQL: tables, security rules, storage, demo data
```

## Getting started

**You need:** Node.js 22.13+ (or 24.3+), the latest **Expo Go** on your phone, and a free [Supabase](https://supabase.com) project.

```bash
git clone <this repository>
cd TeamBuilder
npm install
cp .env.example .env      # then fill in your Supabase URL and publishable key
npx expo start
```

Scan the QR code with Expo Go.

### Supabase setup

1. Create a project. In **Project Settings → API Keys** copy the **Project URL** and the **publishable** key into `.env`. Never put the secret key in the app.
2. In **SQL Editor**, run these files in order: `supabase/schema.sql`, `supabase/storage.sql`, `supabase/ratings.sql`.
3. Optional demo data: sign in to the app once, then run `supabase/seed.sql` (17 demo students, two projects, requests). The first registered user becomes the lead of the demo project.
4. **Sign-in codes by email:** in **Authentication → Emails**, set up custom SMTP (for example Gmail with an app password). Then in the **Confirm sign up** and **Magic link or OTP** templates, show the code with `{{ .Token }}`.

## Security

All data lives in Supabase with Row Level Security:

- profiles and projects are visible to signed-in users, but you can only change your own;
- only the project lead can accept requests or change roles;
- tasks, the project chat and ratings are visible only to team members;
- direct messages are visible only to the two people in them;
- avatars can only be uploaded to your own folder (images only, up to 2 MB).

## License

[MIT](LICENSE)
