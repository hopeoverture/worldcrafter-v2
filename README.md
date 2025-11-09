# WorldCrafter

An immersive world-building and storytelling platform built with Next.js, TypeScript, and Supabase.

## Tech Stack

### Core Framework

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety

### Styling & UI

- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Reusable component library

### Database & Data Fetching

- **Supabase** - PostgreSQL database with built-in auth & storage
- **Prisma** - Type-safe ORM for PostgreSQL
- **TanStack Query** - Powerful data synchronization

### Form Handling & Validation

- **Zod** - TypeScript-first schema validation
- **React Hook Form** - Performant form library

### Testing

- **Vitest** - Unit testing framework
- **Testing Library** - React component testing
- **Playwright** - End-to-end testing

### Code Quality

- **ESLint** - JavaScript linting
- **Prettier** - Code formatting
- **Husky** - Git hooks
- **lint-staged** - Run linters on staged files

### CI/CD

- **GitHub Actions** - Automated testing and builds

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account (free tier available at [supabase.com](https://supabase.com))

### Installation

1. Clone or use this template:

```bash
git clone <your-repo-url>
cd webapp-template
```

2. Install dependencies:

```bash
npm install
```

3. **Set up Supabase Project:**

   a. Create a new project at [https://supabase.com/dashboard](https://supabase.com/dashboard)

   b. Go to **Project Settings** → **API** and copy:
      - Project URL
      - `anon` `public` key

   c. Go to **Project Settings** → **Database** and copy:
      - Connection string (Transaction pooler mode)
      - Connection string (Session pooler mode - for migrations)

4. **Configure environment variables:**

   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

   Update `.env` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
   DATABASE_URL="postgresql://postgres.your-project:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
   DIRECT_DATABASE_URL="postgresql://postgres.your-project:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
   ```

5. **Set up the database:**

   Push your Prisma schema to Supabase:
   ```bash
   npx prisma db push
   ```

   Or create a migration:
   ```bash
   npx prisma migrate dev --name init
   ```

6. **Run the development server:**

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see your app.

## Available Scripts

### Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server

### Testing

- `npm test` - Run unit tests (Vitest)
- `npm run test:e2e` - Run end-to-end tests (Playwright)

### Code Quality

- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

### Database

- `npx prisma generate` - Generate Prisma Client
- `npx prisma migrate dev` - Create and apply migrations
- `npx prisma studio` - Open Prisma Studio GUI

## Project Structure

```
webapp-template/
├── .github/
│   └── workflows/     # GitHub Actions CI/CD
├── e2e/              # Playwright E2E tests
├── prisma/
│   └── schema.prisma # Database schema
├── public/           # Static assets
├── src/
│   ├── app/          # Next.js app directory (routes)
│   ├── components/
│   │   ├── providers/   # React context providers
│   │   └── ui/          # shadcn/ui components
│   └── lib/
│       ├── schemas/     # Zod validation schemas
│       ├── supabase/    # Supabase client utilities
│       ├── env.ts       # Environment variable loader
│       ├── prisma.ts    # Prisma client singleton
│       └── utils.ts     # Utility functions
├── .env              # Environment variables (not committed)
├── .gitignore
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

## Environment Variables

The template uses `dotenv` for environment variable management:

- **Client-side**: Use Next.js `NEXT_PUBLIC_` prefix
- **Server-side**: Import from `@/lib/env` for validated access
- **Tests & Scripts**: Automatically loaded via dotenv

### Important Notes

- Never commit `.env` to version control
- All server-side env vars should be added to `src/lib/env.ts`
- Do not import `@/lib/env` in client components

## Example Pages

- `/` - Homepage
- `/example` - shadcn/ui button demo
- `/example-form` - Form with Zod validation

## Using Supabase

The template includes Supabase client utilities for both client and server components.

### Client Components

```tsx
"use client";

import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function ClientComponent() {
  const [user, setUser] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    getUser();
  }, []);

  return <div>User: {user?.email}</div>;
}
```

### Server Components

```tsx
import { createClient } from "@/lib/supabase/server";

export default async function ServerComponent() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return <div>User: {user?.email}</div>;
}
```

### API Routes / Server Actions

```tsx
"use server";

import { createClient } from "@/lib/supabase/server";

export async function signIn(email: string, password: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }

  return data;
}
```

### Database Access

You can use either Supabase client or Prisma for database operations:

**Using Supabase:**
```tsx
const { data } = await supabase.from('users').select('*');
```

**Using Prisma (Recommended for complex queries):**
```tsx
import { prisma } from "@/lib/prisma";

const users = await prisma.user.findMany();
```

## Testing Strategy

### Unit Tests (Vitest)

- Component testing with Testing Library
- Run automatically on `git commit` via Husky
- Located in `src/components/__tests__/`

### E2E Tests (Playwright)

- Full browser automation
- Run with `npm run test:e2e`
- Located in `e2e/`

## Git Hooks

Pre-commit hooks (via Husky + lint-staged):

- Lint and auto-fix TypeScript/JavaScript files
- Run tests for changed files
- Format code with Prettier

## CI/CD

GitHub Actions workflow runs on push/PR:

1. Install dependencies
2. Run linter
3. Run unit tests
4. Build project

## Deployment

### Vercel + Supabase (Recommended)

This template is optimized for deployment on Vercel with Supabase as the backend.

#### 1. Deploy to Vercel

**Option A: Using Vercel CLI**
```bash
npm i -g vercel
vercel
```

**Option B: Using Vercel Dashboard**
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Vercel will auto-detect Next.js settings

#### 2. Configure Environment Variables in Vercel

Go to your Vercel project → **Settings** → **Environment Variables** and add:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres.your-project:[PASSWORD]@...
DIRECT_DATABASE_URL=postgresql://postgres.your-project:[PASSWORD]@...
```

#### 3. Run Database Migrations

After deployment, run migrations using Vercel CLI:

```bash
vercel env pull .env.production
npx prisma migrate deploy
```

Or use Supabase's SQL editor to run migrations directly.

### Other Platforms

1. Build: `npm run build`
2. Start: `npm start`
3. Set all environment variables from `.env.example`

## Customization

### Adding Prisma Models

1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name your_migration_name`
3. Prisma Client is auto-generated

### Adding shadcn/ui Components

```bash
npx shadcn@latest add [component-name]
```

### Adding Routes

Create files in `src/app/` following Next.js App Router conventions.

## License

MIT

## Contributing

This is a template repository. Fork it and make it your own!
