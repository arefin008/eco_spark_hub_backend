# EcoSpark Hub Backend

EcoSpark Hub Backend is a RESTful API for a sustainability-focused community platform where users can share ideas, vote, comment, purchase access to premium ideas, and subscribe for updates. The application supports role-based access for members and administrators, secure authentication, idea moderation workflows, payment processing, and email-based account actions.

## Live URLs

- Frontend: https://ecospark-hub-frontend.vercel.app/
- Backend API: https://ecosparkhubbackend.vercel.app/
- Repository: https://github.com/arefin008/eco_spark_hub_backend

## Project Description

This backend powers the core business logic of the EcoSpark Hub platform. It allows members to submit sustainability ideas, manage their own content, interact through votes and comments, and purchase access to paid ideas. It also provides administrative tools for moderation, category management, user oversight, and platform statistics.

The project is built with a modular architecture using Express, TypeScript, Prisma, PostgreSQL, and Better Auth, making it suitable for maintainable production-grade development.

## Features

- Secure authentication with email/password, JWT, Better Auth session handling, OTP, and Google OAuth support
- Role-based authorization for members and administrators
- Idea creation, update, deletion, submission, and review workflow
- Admin moderation for approving or rejecting ideas with feedback
- Category management for organizing sustainability ideas
- Voting system with upvote, downvote, and vote removal support
- Comment system for idea discussions
- Paid idea purchase flow with Stripe checkout and webhook confirmation
- Newsletter subscription management
- Cloudinary-based media upload handling
- Email templates for verification, OTP, password reset, and payment-related communication
- Centralized validation, error handling, and structured API responses

## Technologies Used

- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- Better Auth
- JWT
- Zod
- Stripe
- Nodemailer
- EJS
- pnpm
- Vercel

## API Overview

Base API URL:

- `http://localhost:5000/api/v1`

Authentication base:

- `http://localhost:5000/api/auth`

Health check:

- `GET /`

Main modules:

- Auth
- Admin
- Users
- Categories
- Ideas
- Votes
- Comments
- Purchases
- Payments
- Newsletter

## Setup Instructions

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

Create a `.env` file in the project root and add the required configuration.

Minimum required variables:

```env
NODE_ENV=development
PORT=5000
DATABASE_URL=your_postgresql_database_url
BETTER_AUTH_SECRET=your_better_auth_secret
BETTER_AUTH_URL=http://localhost:5000
FRONTEND_URL=http://localhost:3000
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/callback/google
```

Additional services used by the project may require:

- Google OAuth credentials
- SMTP email credentials
- Cloudinary credentials
- Stripe secret keys and webhook secret
- Optional super admin seed credentials

You can also use the provided `.env.example` as a starting point.

### 4. Generate the Prisma client

```bash
pnpm generate
```

### 5. Apply database migrations

```bash
pnpm migrate
```

If you want to sync the schema without creating a migration in development:

```bash
pnpm push
```

### 6. Start the development server

```bash
pnpm dev
```

The server will run on:

```bash
http://localhost:5000
```

## Available Scripts

- `pnpm dev` - Start the development server with watch mode
- `pnpm build` - Build the project for deployment
- `pnpm start` - Run the compiled application
- `pnpm lint` - Run ESLint on the source code
- `pnpm generate` - Generate the Prisma client
- `pnpm migrate` - Run Prisma migrations
- `pnpm push` - Push the Prisma schema to the database
- `pnpm pull` - Pull the database schema
- `pnpm studio` - Open Prisma Studio
- `pnpm stripe:webhook` - Forward Stripe webhook events to local development

## Project Structure

```text
src/
  app/
    config/
    errorHelpers/
    interfaces/
    lib/
    middleware/
    modules/
    routes/
    shared/
    templates/
    utils/
  app.ts
  index.ts
  server.ts
prisma/
  migrations/
  schema/
api/
docs/
```

## Notes

- The application uses modular route organization for scalability and maintainability.
- CORS is configured for local development and configured frontend/backend origins.
- Prisma is configured with a split schema structure for cleaner database modeling.
- Stripe webhook support is included for payment status synchronization.
- Deployment configuration for Vercel is already present in the project.
