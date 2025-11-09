// src/lib/env.ts
import "dotenv/config";

// Central place to read & validate environment variables for server-side code.
// IMPORTANT: Only import this from server code (never from client components).

// Utility to require environment variables (currently unused but available for future use)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  DATABASE_URL: process.env.DATABASE_URL ?? "",
  DIRECT_DATABASE_URL: process.env.DIRECT_DATABASE_URL ?? "",
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};
