# EcoSpark Hub Backend

A production-ready REST API for the EcoSpark Hub platform, built with Express, TypeScript, Prisma, PostgreSQL, and Better Auth.

## Overview

This service handles:
- Authentication and session management
- User and admin operations
- Idea publishing and moderation workflow
- Voting and commenting
- Purchase and Stripe payment flow
- Newsletter subscription management

Base API URL:
- `http://localhost:5000/api/v1`

Auth provider routes:
- `http://localhost:5000/api/auth`

Health check:
- `GET /`

## Tech Stack

- Runtime: Node.js
- Framework: Express 5
- Language: TypeScript
- ORM: Prisma 7 (PostgreSQL)
- Auth: Better Auth (email/password, Google OAuth, OTP)
- Validation: Zod
- Payments: Stripe
- File handling: Multer + Cloudinary
- Email: Nodemailer + EJS templates

## Project Structure

```txt
src/
  app/
    config/          # environment and app config
    lib/             # auth, prisma and integrations
    middleware/      # auth, validation, error handling
    modules/         # feature modules (auth, idea, payment, etc.)
    routes/          # API route registry
    templates/       # email templates
    utils/           # shared utilities (email, seeding, query helpers)
  server.ts          # bootstrap and process-level handlers
prisma/
  schema/            # split Prisma schema files
  migrations/        # Prisma migrations
```

## Environment Variables

Create a `.env` file in the project root.

### Required to Start

| Variable | Description |
| --- | --- |
| `NODE_ENV` | Runtime environment (`development`, `production`) |
| `PORT` | API server port (e.g., `5000`) |
| `DATABASE_URL` | PostgreSQL connection URL |
| `BETTER_AUTH_SECRET` | Better Auth secret key |
| `BETTER_AUTH_URL` | Backend public URL (e.g., `http://localhost:5000`) |

### Core Auth and Token Config

| Variable | Default |
| --- | --- |
| `ACCESS_TOKEN_SECRET` | `dev-access-token-secret` |
| `REFRESH_TOKEN_SECRET` | `dev-refresh-token-secret` |
| `ACCESS_TOKEN_EXPIRES_IN` | `1h` |
| `REFRESH_TOKEN_EXPIRES_IN` | `7d` |
| `BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN` | `1d` |
| `BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE` | `1h` |

### Frontend / OAuth

| Variable | Description |
| --- | --- |
| `FRONTEND_URL` | Frontend origin (default: `http://localhost:3000`) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | Google OAuth callback URL |

### Email Sender

| Variable |
| --- |
| `EMAIL_SENDER_SMTP_USER` |
| `EMAIL_SENDER_SMTP_PASS` |
| `EMAIL_SENDER_SMTP_HOST` |
| `EMAIL_SENDER_SMTP_PORT` |
| `EMAIL_SENDER_SMTP_FROM` |

### Cloudinary

| Variable |
| --- |
| `CLOUDINARY_CLOUD_NAME` |
| `CLOUDINARY_API_KEY` |
| `CLOUDINARY_API_SECRET` |

### Stripe

| Variable |
| --- |
| `STRIPE_SECRET_KEY` |
| `STRIPE_WEBHOOK_SECRET` |

### Optional Super Admin Seeding

If both variables are present, the server seeds/repairs an admin account at startup.

| Variable |
| --- |
| `SUPER_ADMIN_EMAIL` |
| `SUPER_ADMIN_PASSWORD` |

## Getting Started

1. Install dependencies

```bash
pnpm install
```

2. Configure environment

Copy `.env.example` to `.env` manually (or use `cp .env.example .env` on Unix).

3. Generate Prisma client

```bash
pnpm generate
```

4. Apply migrations (recommended)

```bash
pnpm migrate
```

Alternative for development sync:

```bash
pnpm push
```

5. Start the development server

```bash
pnpm dev
```

Server runs at:
- `http://localhost:5000`

## Available Scripts

- `pnpm dev` - run in watch mode using `tsx`
- `pnpm build` - compile TypeScript to `dist`
- `pnpm start` - run compiled server
- `pnpm lint` - run ESLint
- `pnpm generate` - generate Prisma client
- `pnpm migrate` - run Prisma migrate dev
- `pnpm push` - push schema to DB
- `pnpm pull` - pull schema from DB
- `pnpm studio` - open Prisma Studio
- `pnpm stripe:webhook` - forward Stripe events to local webhook endpoint

## API Modules

All routes are mounted under `/api/v1`.

### Auth (`/auth`)
- `POST /register`
- `POST /login`
- `POST /refresh-token`
- `GET /me`
- `POST /change-password`
- `POST /logout`
- `POST /verify-email`
- `POST /forgot-password`
- `POST /reset-password`

### Admin (`/admins`)
- `GET /stats`
- `PATCH /users/:id/status`

### Users (`/users`)
- `GET /`
- `GET /:id`
- `PATCH /:id`

### Categories (`/categories`)
- `GET /`
- `POST /`
- `PATCH /:id`
- `DELETE /:id`

### Ideas (`/ideas`)
- `GET /`
- `GET /mine`
- `GET /:id`
- `POST /`
- `PATCH /:id`
- `DELETE /:id`
- `PATCH /:id/submit`
- `PATCH /:id/review`

### Votes (`/votes`)
- `POST /`
- `DELETE /`

### Comments (`/comments`)
- `GET /idea/:ideaId`
- `POST /`
- `DELETE /:id`

### Purchases (`/purchases`)
- `POST /`
- `GET /me`

### Payments (`/payments`)
- `POST /confirm`
- `GET /stripe/success`
- `GET /stripe/cancel`
- `POST /:purchaseId/checkout`
- `GET /:purchaseId/status`
- `POST /webhook`

### Newsletter (`/newsletters`)
- `POST /subscribe`
- `PATCH /unsubscribe/:email`
- `GET /`

## Notes

- CORS is configured for `FRONTEND_URL`, `BETTER_AUTH_URL`, and localhost origins.
- Request payloads are validated with Zod before reaching controllers.
- Global error handling and 404 handling are enabled.
