# EcoSpark Hub Backend

Backend API for EcoSpark Hub built with Express, TypeScript, Prisma, PostgreSQL, and Better Auth.

## What Is Completed

- Full Prisma schema for EcoSpark domain and auth
  - User, Session, Account, Verification
  - Category, Idea, IdeaMedia
  - IdeaVote, IdeaComment (nested)
  - IdeaPurchase (paid idea access)
  - NewsletterSubscriber
- Better Auth integration
  - Email/password auth
  - Google social login
  - Email verification flow
  - Email OTP flow
  - Forgot password / reset password email flow
- Admin control hardening
  - Admin account is seeded
  - Admin role blocked from normal sign-up route
- API module architecture implemented
  - auth
  - admin
  - user
  - category
  - idea
  - vote
  - comment
  - purchase
  - payment
  - newsletter
- Query support for GET endpoints via reusable QueryBuilder
  - search
  - filter
  - sort
  - pagination
- Email system
  - EJS templates for OTP, verification, reset password
  - Nodemailer-based sender utility
- Global middleware and infrastructure
  - global error handler
  - not found handler
  - request validation
  - role-based auth guard
  - request user attach bridge (dev header-based)

## Main Routes

Base URL: `http://localhost:5000/api/v1`

- `/auth`
- `/admins`
- `/users`
- `/categories`
- `/ideas`
- `/votes`
- `/comments`
- `/purchases`
- `/payments`
- `/newsletters`

Better Auth routes are mounted at: `http://localhost:5000/api/auth`

## Local Setup

1. Install dependencies:
   - `pnpm install`
2. Generate Prisma client:
   - `pnpm prisma generate`
3. Sync schema to DB:
   - `pnpm prisma db push`
4. Run development server:
   - `pnpm dev`

## Notes

- Environment variables are in `.env`.
- Project is ready for Postman testing.
