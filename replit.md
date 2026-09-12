# Rakhsh — Smart Assistant Platform

A full-stack Persian-language web application built with React + Express + PostgreSQL. Features WhatsApp bot integration, crypto payment tracking (USDT/TRX/XRP/ADA), invoice generation, email/SMTP, AI assistant (Google Gemini), and a subscription/product shop.

## Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Radix UI, Wouter routing, TanStack Query
- **Backend**: Express (TypeScript), tsx for dev, esbuild for prod
- **Database**: PostgreSQL via Drizzle ORM (`npm run db:push` to sync schema)
- **Auth**: Passport.js (local + Google OAuth), JWT, express-session

## How to run

```bash
npm run dev        # development (port 5000)
npm run build      # production build
npm run start      # serve production build
npm run db:push    # sync Drizzle schema to the database
```

The workflow **Start application** runs `npm run dev` and serves on port 5000.

## Admin login

- **Username**: `ehsan`
- **Password**: set via `ADMIN_PASSWORD` secret (defaults to `admin123` in dev mode)

## Environment variables

Store these as **Replit Secrets** (never put credentials in `.replit`):

| Key | Required | Notes |
|-----|----------|-------|
| `DATABASE_URL` | ✅ | Managed by Replit automatically |
| `SESSION_SECRET` | ✅ | Express session secret |
| `JWT_SECRET` | Recommended | JWT signing key — uses a fixed dev key if unset |
| `ADMIN_PASSWORD` | Recommended | Admin account password — defaults to `admin123` if unset |
| `SMTP_HOST/PORT/USER/PASS/FROM` | Optional | Email sending |
| `TRONGRID_API_KEY` | Optional | Tron blockchain queries |
| `CARDANOSCAN_API_KEY` | Optional | Cardano blockchain queries |

## User preferences
