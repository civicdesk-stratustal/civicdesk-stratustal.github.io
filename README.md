# Life Admin Hub

# SYSTEM ROLE & OBJECTIVE
You are an expert React, Tailwind CSS, and Supabase developer. Build the production-ready MVP for "CivicDesk", a mobile-first life-admin assistant.
The app is built as a responsive web app intended to be wrapped into a native mobile APK (via Median/Capacitor). It must look and behave like a genuine native mobile app, not a desktop dashboard.

Core Loop: Capture Document → Extract Data → Set Deadline → Recommend Action → Sync to Google Calendar → Remind → Complete.

# TECH STACK
- Framework: React (Vite) + TypeScript
- Routing: react-router-dom
- Styling: Tailwind CSS + Lucide React icons
- Backend & Auth: Supabase (`@supabase/supabase-js`)
- UI Theme: Mobile-First "Liquid Glass" / Glassmorphism
- Local Security: Web Storage (`localStorage`) with App Visibility detection

# 1. UI/UX ARCHITECTURE: "LIQUID GLASS" (MOBILE-FIRST)
The app must have a dark, atmospheric, premium iOS/visionOS frosted glass feel.
- Viewport: Lock layout to mobile dimensions on desktop (max-w-md mx-auto min-h-screen relative shadow-2xl overflow-x-hidden).
- Backgrounds: Deep dark background (`bg-slate-950`) with subtle, blurred ambient gradient orbs (`bg-gradient-to-tr from-blue-600/20 via-purple-600/10 to-transparent blur-3xl`).
- Glass Cards: `backdrop-blur-xl bg-white/[0.07] border border-white/15 shadow-xl rounded-2xl`.
- High Contrast Text: Primary headers in pure white (`text-white`), secondary labels in `text-white/60`.
- Navigation: Floating bottom navigation bar styled as a pill-shaped glass container (`backdrop-blur-2xl bg-black/40 border border-white/15 fixed bottom-4 inset-x-4 max-w-sm mx-auto rounded-full py-3 px-6 flex justify-around items-center z-40`). Include safe-area padding for mobile wrappers.
- Touch Targets: Minimum 44x44px for buttons, no hover-dependent states.

# 2. SUPABASE DATABASE SCHEMA & RLS
Connect directly to Supabase using standard environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`).
Assume the following PostgreSQL schema with strict Row Level Security (`auth.uid() = user_id`):
- `profiles`: id (uuid, references auth.users), full_name, avatar_url, preferences (jsonb default: '{"calendar_sync": false}').
- `items`: id, user_id (uuid), title, category, brand, purchase_date, created_at.
- `documents`: id, user_id (uuid), item_id, file_path (storage path in 'documents' bucket), extracted_data (jsonb).
- `deadlines`: id, user_id, item_id, title, deadline_date (timestamptz), recommended_action, status, google_event_id.

# 3. CORE FEATURES TO BUILD

## A. Authentication & On-Device Security
1. Supabase Auth:
   - Primary: Standard Email/Password sign up & sign in form with tab toggle.
   - Secondary: "Continue with Google" OAuth button triggering `supabase.auth.signInWithOAuth({ provider: 'google', options: { query: { access_type: 'offline', prompt: 'consent' } } })`.
   - Store the session's `provider_token` (Google OAuth access token) securely in application state/session for Calendar operations.
2. 4-Digit PIN Security Lock:
   - First-time setup: After sign-in, prompt the user to establish a 4-digit numeric PIN. Store the hashed/encoded PIN in `localStorage`.
   - Lock Guard: When the user opens the app or returns to the tab (`document.visibilityState === 'visible'`), display a full-screen frosted glass PIN keypad.
   - Keypad UI: Large translucent circular touch buttons (0-9, backspace, clear) with smooth active touch feedback. Users cannot view dashboard data until unlocked.

## B. Home Dashboard ("Action-First")
- Top Bar: Greeting ("Good morning/afternoon, [User]"), notification bell icon, and subtle branding: "CivicDesk Beta by Stratustal".
- Urgency Filters / Tabs: "All", "Needs Attention", "Upcoming", "Completed".
- Action Cards: Render deadlines sorted by urgency (Overdue, Today, This Week, Later).
  - Card layout: Item title, category badge, time remaining (e.g., "Ends in 3 days"), recommended practical action (e.g., "Test television before return window expires"), and a "Mark Complete" button.

## C. Add Item & Document Upload Flow
- Prominent floating action button or header CTA: "+ Add Item".
- Upload Document Option: HTML5 file input supporting Camera capture on mobile (`accept="image/*,application/pdf"`).
- Storage: Upload files directly to the Supabase Storage bucket `documents`.
- Simulated Intelligence Screen: After file selection, show a confirmation modal showing mock extracted details (Document Type, Brand, Purchase Date, Warranty Expiry). Allow the user to edit fields or click "Looks Good" to create the item and deadline.

## D. Google Calendar Sync Service
- Create a dedicated calendar integration utility (`src/utils/googleCalendar.ts`).
- When an item deadline is created, check if Google Calendar Sync is toggled ON.
- If enabled and `provider_token` exists, issue a POST request to `https://www.googleapis.com/calendar/v3/calendars/primary/events` to insert an all-day event with the recommended action in the description.
- Save the returned Google Calendar event ID in the `deadlines.google_event_id` field.

## E. Main Sections & Navigation
- Tabs:
  1. Home (Action Dashboard)
  2. Items (List of all tracked belongings with category filter tags: Electronics, Subscriptions, Household, Documents)
  3. Calendar (Visual monthly calendar and upcoming date list)
  4. Settings (Google Calendar Sync toggle, Change PIN, Sign Out, Data Privacy notice, Beta info)

# 4. IMPLEMENTATION GUIDELINES FOR LOVABLE
- Build modular components: `GlassCard`, `GlassButton`, `GlassInput`, `PinLockModal`, `ActionCard`.
- Include mock data fallbacks so the dashboard is immediately viewable and testable if the Supabase tables are initially empty.
- Ensure all forms have clear validation, error toasts, and loading states.
- Optimize CSS for mobile viewport height (`100dvh`) to avoid scrolling glitches inside webview wrappers like Median.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/542f5717-0b96-4ec4-ba93-06df599e5abe).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
