# Supabase Setup Guide

This guide will walk you through setting up Supabase with your Next.js application.

## Prerequisites

- A Supabase account ([sign up here](https://supabase.com))
- Node.js 18+ installed
- This template cloned and dependencies installed

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: Your project name (e.g., "my-webapp")
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Select the closest region to your users
   - **Pricing Plan**: Start with the free tier
4. Click **"Create new project"**
5. Wait 1-2 minutes for your project to be set up

## Step 2: Get Your API Credentials

### Supabase URL and Anon Key

1. In your Supabase dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxxxxxxxxxx.supabase.co`)
   - **`anon` `public` key** (starts with `eyJ...`)

### Database Connection Strings

1. Go to **Settings** → **Database**
2. Scroll down to **Connection string**
3. Select **URI** from the dropdown
4. Copy **two** connection strings:

   **a. Transaction Connection (Port 6543 - for Prisma queries with pooling):**
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   ```

   **b. Direct Connection (Port 5432 - for Prisma migrations):**
   ```
   postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres
   ```

   **Important:** Replace `[YOUR-PASSWORD]` with your actual database password!

## Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` and fill in your Supabase credentials:

   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxxx.supabase.co"
   NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJxxxxxxxxx..."

   # Database Configuration
   DATABASE_URL="postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
   DIRECT_DATABASE_URL="postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
   ```

## Step 4: Set Up Your Database Schema

### Option A: Push Schema Directly (Quickstart)

For development, you can push your Prisma schema directly:

```bash
npx prisma db push
```

This will create the `User` table in your Supabase database.

### Option B: Use Migrations (Recommended for Production)

For production applications, use migrations:

```bash
npx prisma migrate dev --name init
```

This creates a migration file and applies it to your database.

## Step 5: Verify the Setup

1. **Check the Database:**
   - Go to **Table Editor** in your Supabase dashboard
   - You should see a `User` table

2. **Test Prisma Connection:**
   ```bash
   npx prisma studio
   ```
   This opens Prisma Studio at http://localhost:5555 where you can view/edit data.

3. **Run Your Application:**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000 - your app should start without errors.

## Step 6: Enable Authentication (Optional)

If you want to use Supabase Authentication:

1. Go to **Authentication** → **Providers** in Supabase dashboard
2. Enable the authentication methods you want:
   - Email/Password
   - Magic Link
   - OAuth (Google, GitHub, etc.)

3. Configure redirect URLs:
   - Go to **Authentication** → **URL Configuration**
   - Add your site URL:
     - Development: `http://localhost:3000`
     - Production: `https://your-domain.com`

## Using Supabase Features

### Database Operations

**Using Prisma (Recommended):**
```typescript
import { prisma } from "@/lib/prisma";

// Create a user
const user = await prisma.user.create({
  data: {
    email: "user@example.com",
    name: "John Doe",
  },
});

// Query users
const users = await prisma.user.findMany();
```

**Using Supabase Client:**
```typescript
import { createClient } from "@/lib/supabase/server";

const supabase = await createClient();
const { data, error } = await supabase
  .from('User')
  .select('*')
  .eq('email', 'user@example.com');
```

### Authentication

**Sign Up:**
```typescript
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password',
});
```

**Sign In:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'secure-password',
});
```

**Get Current User:**
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

### Storage (File Uploads)

1. Create a storage bucket in **Storage** dashboard
2. Use Supabase client to upload files:

```typescript
const { data, error } = await supabase.storage
  .from('avatars')
  .upload('public/avatar1.png', file);
```

## Deployment

### Deploying to Vercel

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Add Supabase integration"
   git push
   ```

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Import Project"
   - Select your GitHub repository

3. **Add Environment Variables:**
   In Vercel project settings, add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `DATABASE_URL`
   - `DIRECT_DATABASE_URL`

4. **Run Migrations:**
   ```bash
   vercel env pull .env.production
   npx prisma migrate deploy
   ```

## Troubleshooting

### Connection Issues

**Error: `Can't reach database server`**
- Check your database password is correct
- Verify you're using the correct connection string
- Check if you're using port 6543 for queries and 5432 for migrations

**Error: `P1001: Can't reach database server`**
- Your IP might be blocked. Supabase allows all IPs by default, but check **Settings** → **Database** → **Connection pooling**

### Migration Issues

**Error: `Migration failed to apply`**
- Make sure you're using `DIRECT_DATABASE_URL` (port 5432) for migrations
- Check the migration file for syntax errors
- Verify the database user has proper permissions

### Authentication Issues

**Redirect not working:**
- Check your redirect URLs in **Authentication** → **URL Configuration**
- Ensure they match your actual URLs (no trailing slashes)

## Next Steps

- Read the [Supabase Documentation](https://supabase.com/docs)
- Explore [Supabase Examples](https://github.com/supabase/supabase/tree/master/examples)
- Learn about [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- Set up [Realtime subscriptions](https://supabase.com/docs/guides/realtime)

## Support

- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub Discussions](https://github.com/supabase/supabase/discussions)
- [Prisma Discord](https://pris.ly/discord)
