# ZIPIR! - Daily Word Game

ZIPIR! is a web-based daily word game inspired by classic Turkish word games. Players solve a set of 14 questions daily, ranging from 4-letter words to 10-letter words, within a 4-minute time limit.

## Project Overview

- **Main Technologies:** Next.js (App Router), React, Supabase, Tailwind CSS, TypeScript, CryptoJS.
- **Architecture:** 
  - **Frontend:** React with Tailwind CSS, utilizing Server Actions for database interactions and API routes for fetching questions.
  - **Backend:** Supabase for database storage (questions, leaderboard).
  - **Security:** AES encryption via CryptoJS is used to protect answers in transit and in local storage.
  - **State Management:** React `useState`, `useEffect`, and `useRef` for game logic; LocalStorage (encrypted) for persistent session state.

## Building and Running

### Prerequisites
- Node.js (version 20 or higher recommended)
- Supabase account and project
- Environment variables configured in `.env`

### Key Commands
- **Install Dependencies:** `npm install`
- **Run Development Server:** `npm run dev`
- **Build for Production:** `npm run build`
- **Start Production Server:** `npm run start`
- **Linting:** `npm run lint`

### Environment Variables (.env)
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key.
- `NEXT_PUBLIC_ENCRYPTION_KEY`: A secret key used for AES encryption/decryption of game data.

## Development Conventions

- **Component Structure:** Uses the Next.js App Router. Components are mostly client-side (`"use client"`) for the interactive game loop.
- **Data Fetching:** Questions are fetched via an API route (`/api/questions`) which encrypts the answers before sending them to the client.
- **Database Interaction:** Prefers Next.js Server Actions (`app/actions.ts`) for writing data like scores and fetching user stats.
- **Naming Conventions:** Follows standard React and TypeScript camelCase for variables/functions and PascalCase for components.
- **Styling:** Tailwind CSS is used for all styling, including animations for game feedback (e.g., shaking on wrong answers, countdown pop).
- **Internationalization:** The application logic and UI are currently optimized for the Turkish language (e.g., Turkish locale-aware string comparisons).

## Key Files
- `app/page.tsx`: The main game interface and logic.
- `app/actions.ts`: Server-side actions for leaderboard and stats.
- `app/api/questions/route.ts`: API endpoint for fetching daily questions.
- `lib/supabase.ts`: Supabase client initialization.
- `public/sounds/`: Audio assets for game feedback.
