# EcoSpark Hub Backend

EcoSpark Hub Backend is a TypeScript and Express API for a sustainability idea-sharing platform. It powers authentication, role-based access, idea submission and moderation, comments and votes, paid idea access, newsletter subscriptions, and Gemini-powered drafting and assistant features.

## Live URLs

- Frontend: https://ecospark-hub-frontend.vercel.app/
- Backend API: https://ecosparkhubbackend.vercel.app/
- Repository: https://github.com/arefin008/eco_spark_hub_backend

## What This Backend Handles

- Better Auth based authentication with email/password, email OTP verification, password reset, bearer auth, and Google OAuth
- Separate member and admin authorization rules
- Idea drafting, submission, moderation, paid access, and ownership-based access control
- Category, comment, vote, purchase, payment, newsletter, user, and admin management
- Stripe checkout and webhook-based payment confirmation
- Automatic super admin seeding on server startup when seed credentials are configured
- Gemini integration for AI assistant responses and AI-assisted idea draft improvement

## Tech Stack

- Node.js
- Express 5
- TypeScript
- Prisma ORM
- PostgreSQL
- Better Auth
- JWT
- Zod
- Stripe
- Cloudinary
- Nodemailer
- EJS
- Vercel
- pnpm

## API Base URLs

- REST API base: `http://localhost:5000/api/v1`
- Better Auth base: `http://localhost:5000/api/auth`
- Health check: `GET /`

## Main Route Groups

Under `/api/v1`:

- `/ai`
- `/auth`
- `/users`
- `/admins`
- `/categories`
- `/ideas`
- `/votes`
- `/comments`
- `/purchases`
- `/payments`
- `/newsletters`

Auth routes are split between:

- Custom application auth routes under `/api/v1/auth`
- Better Auth managed routes under `/api/auth`

## Key Features

### Authentication and Access Control

- Email/password registration and login
- Email OTP verification for account verification and password reset
- JWT access and refresh tokens
- Better Auth session handling with secure cookies
- Google social login
- Admin account creation restricted to environment-based seed credentials
- Deactivated users blocked from protected flows

### Idea Workflow

- Members can create, update, delete, and submit ideas for review
- Admins can approve or reject submitted ideas
- Public idea listing supports search, filtering, sorting, and pagination
- Paid ideas are access-gated unless the viewer is the author, an admin, or has a successful purchase
- Ideas support media URLs, category assignment, pricing, highlight flags, and moderation status tracking

### Community and Commerce

- Upvote and downvote support with one vote per user per idea
- Nested comments through parent-child comment relations
- Purchase records for paid ideas
- Stripe checkout session creation
- Stripe success, cancel, status, confirm, and webhook handling
- Newsletter subscribe, unsubscribe, and admin listing support

### AI Support

- `POST /api/v1/ai/assistant` for grounded assistant responses using supplied idea context
- `POST /api/v1/ai/draft` for improving and completing an idea draft with Gemini
- Retry handling for short-lived Gemini rate limit responses

## Environment Variables

Required at startup:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=your_secret
BETTER_AUTH_URL=http://localhost:5000
```

Common application variables:

```env
FRONTEND_URL=http://localhost:3000

ACCESS_TOKEN_SECRET=dev-access-token-secret
REFRESH_TOKEN_SECRET=dev-refresh-token-secret
ACCESS_TOKEN_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d
BETTER_AUTH_SESSION_TOKEN_EXPIRES_IN=1d
BETTER_AUTH_SESSION_TOKEN_UPDATE_AGE=1h

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=

EMAIL_SENDER_SMTP_USER=
EMAIL_SENDER_SMTP_PASS=
EMAIL_SENDER_SMTP_HOST=
EMAIL_SENDER_SMTP_PORT=
EMAIL_SENDER_SMTP_FROM=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash-lite

SUPER_ADMIN_EMAIL=
SUPER_ADMIN_PASSWORD=
```

Notes:

- If `SUPER_ADMIN_EMAIL` and `SUPER_ADMIN_PASSWORD` are set, the server seeds or repairs the super admin account on startup.
- `FRONTEND_URL` is used for trusted redirects and Google login callback flow.
- Stripe webhook verification requires `STRIPE_WEBHOOK_SECRET`.
- Gemini features require `GEMINI_API_KEY`.

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/arefin008/eco_spark_hub_backend
cd eco_spark_hub_backend
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Create a `.env` file in the project root. You can start from `.env.example`, but the current code supports more variables than that example file lists, so add the missing ones you need from the section above.

### 4. Generate Prisma client

```bash
pnpm generate
```

### 5. Apply schema changes

For development migrations:

```bash
pnpm migrate
```

For direct schema sync without a new migration:

```bash
pnpm push
```

### 6. Start the development server

```bash
pnpm dev
```

Server URL:

```bash
http://localhost:5000
```

## Available Scripts

- `pnpm dev` - Run the server in watch mode
- `pnpm build` - Generate Prisma client and build the Vercel server bundle into `api/`
- `pnpm start` - Run the compiled server
- `pnpm lint` - Run ESLint
- `pnpm generate` - Generate Prisma client
- `pnpm migrate` - Run Prisma development migrations
- `pnpm push` - Push the Prisma schema to the database
- `pnpm pull` - Pull the database schema
- `pnpm studio` - Open Prisma Studio
- `pnpm stripe:webhook` - Forward Stripe webhook events to local `/api/v1/payments/webhook`

## Data Model Highlights

- `User` with `MEMBER` and `ADMIN` roles and `ACTIVE` or `DEACTIVATED` status
- `Idea` with moderation statuses `DRAFT`, `UNDER_REVIEW`, `APPROVED`, and `REJECTED`
- `IdeaMedia`, `IdeaVote`, and nested `IdeaComment`
- `IdeaPurchase` with `PENDING`, `PAID`, `FAILED`, and `REFUNDED` states
- `NewsletterSubscriber`
- Better Auth tables for `Session`, `Account`, and `Verification`

## Query Support

Several list endpoints support combinations of:

- `searchTerm`
- `page`
- `limit`
- `sortBy`
- `sortOrder`

Additional route-specific filters include values such as:

- user `role`, `status`
- idea `categoryId`, `authorId`, `isPaid`, `paymentStatus`, `status`, `minUpvotes`

The idea listing supports logical sort options such as recent, top voted, and most commented.

## Project Structure

```text
api/
prisma/
  migrations/
  schema/
src/
  app/
    config/
    errorHelpers/
    lib/
    middleware/
    modules/
    routes/
    shared/
    templates/
    utils/
  generated/
  app.ts
  index.ts
  server.ts
ALL_ROUTES.md
vercel.json
```

## Deployment Notes

- The project is configured for Vercel using `api/index.js` as the server entry.
- The `pnpm build` script outputs the deployable bundle to the `api/` directory.
- Root route `GET /` returns a simple API health response.
