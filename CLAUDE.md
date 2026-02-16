# DanceCircle

Niche social media platform for dancers. Connect with dancers worldwide, discover dance cities, events, music, and communities.

**Live site:** dancecircle.co

## Tech Stack

- **Framework:** Next.js 14 (App Router) with TypeScript
- **Database:** MongoDB via Mongoose (`libs/mongoose.ts` for connection)
- **Auth:** NextAuth.js v4 with Google OAuth (`libs/next-auth.ts`)
- **Styling:** Tailwind CSS + DaisyUI (dark theme default)
- **Payments:** Stripe
- **Image hosting:** ImageKit (`@imagekit/next`), Cloudinary (legacy)
- **Email:** Resend
- **Maps:** Mapbox GL
- **i18n:** next-intl (English + Spanish, via `messages/en.json` and `messages/es.json`)
- **Mobile:** Capacitor (iOS + Android native wrappers pointing to the live site)
- **Analytics:** Vercel Analytics, Facebook Pixel
- **Deployment:** Vercel
- **Push Notifications:** Firebase + Capacitor

## Project Structure

```
app/                  # Next.js App Router pages and API routes
  api/                # API routes (REST endpoints)
  [username]/         # Dynamic public dancer profiles
  dashboard/          # Authenticated user dashboard
  onboarding/         # New user onboarding flow
  feed/               # Social feed
  friends/            # Friends management
  settings/           # User settings
  admin/              # Admin panel
  discover/           # Discovery/explore page
components/           # React components (flat + molecules/organisims subdirs)
models/               # Mongoose schemas (User, City, Country, DanceStyle, Post, etc.)
libs/                 # Core integrations (mongoose, next-auth, stripe, resend, api client, seo)
lib/                  # i18n helpers
utils/                # Utility functions (notifications, search, badges, leaderboards, etc.)
hooks/                # Custom React hooks (useCapacitor, usePresence, usePushNotifications)
contexts/             # React contexts (FriendRequestContext, LikesContext)
types/                # TypeScript type definitions
constants/            # Static data (countries, dance levels, badges, zodiac)
messages/             # i18n translation files (en.json, es.json)
scripts/              # DB migration and seeding scripts
public/               # Static assets
config.ts             # App-wide config (app name, domain, Stripe plans, email, social, auth)
middleware.ts         # Auth guards, onboarding redirects, i18n locale detection
```

## Key Commands

```bash
npm run dev           # Start dev server (localhost:3000)
npm run build         # Production build + sitemap generation
npm run lint          # ESLint
npm run start         # Start production server
```

## Key Patterns

### Database
- All DB access goes through `connectMongo()` from `libs/mongoose.ts` (cached connection for serverless)
- Models live in `models/` and use Mongoose schemas
- The `User` model is central and very large -- has dance styles, trips, social features, professional profiles, notification settings, etc.

### Authentication
- NextAuth with Google OAuth provider
- Middleware enforces onboarding: incomplete profiles get redirected to `/onboarding`
- Public routes are explicitly whitelisted in `middleware.ts`
- Admin access controlled via `config.ts` admin email

### API Routes
- REST endpoints under `app/api/`
- Use `connectMongo()` at the start of each handler
- Auth checked via `getServerSession(authOptions)`

### Caching
- Landing page uses `unstable_cache` with tags for granular revalidation
- Cache times: 5-30 minutes depending on data volatility

### i18n
- Locale detected in middleware from: user DB preference > cookie (`NEXT_LOCALE`) > `accept-language` header
- Locale passed to server components via `x-locale` request header
- Translation keys accessed via `getTranslation(messages, 'key.path')`

### Components
- Path alias `@/*` maps to project root
- DaisyUI component classes used extensively (btn, card, badge, etc.)
- `components/molecules/` and `components/organisims/` for composed components

### Mobile (Capacitor)
- App loads the live website in a native shell
- Capacitor config in `capacitor.config.ts` (app ID: `com.dancecircle.app`)
- Push notifications via Firebase + Capacitor plugin

## Environment Variables

See `.env.example` for all required variables:
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET` -- Auth
- `GOOGLE_ID`, `GOOGLE_SECRET` -- Google OAuth
- `MONGODB_URI` -- Database
- `RESEND_API_KEY` -- Email
- `STRIPE_PUBLIC_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` -- Payments
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` -- Image uploads

## Domain Concepts

- **Dancers** have profiles with dance styles (salsa, bachata, kizomba, etc.), skill levels, home city, and travel plans
- **Cities** are geographic hubs ranked by dancer population
- **Dance Styles** are categorized and tracked per user with levels (beginner to expert)
- **Professional roles:** Teacher, DJ, Photographer, Event Organizer, Producer
- **Social features:** Friends, likes, profile views, posts/feed, messaging, leaderboards
- **Trips:** Users can announce upcoming travel to dance cities
- **Anthem:** Each dancer can set a Spotify/YouTube song on their profile
