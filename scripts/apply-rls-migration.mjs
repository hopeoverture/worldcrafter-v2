#!/usr/bin/env node

/**
 * Apply RLS Migration to Supabase Database
 *
 * This script applies the RLS policies from the SQL migration file
 * to your Supabase database using the DIRECT_DATABASE_URL
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ES module equivalents for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function main() {
  log('========================================', colors.blue);
  log('Applying RLS Migration', colors.blue);
  log('========================================', colors.blue);

  // Check if DIRECT_DATABASE_URL is set
  if (!process.env.DIRECT_DATABASE_URL) {
    log('Error: DIRECT_DATABASE_URL not set in .env file', colors.red);
    log('Please add DIRECT_DATABASE_URL to your .env file', colors.red);
    process.exit(1);
  }

  const migrationFile = path.join(__dirname, '..', 'prisma', 'migrations', 'sql', '001_enable_rls.sql');

  // Check if migration file exists
  if (!fs.existsSync(migrationFile)) {
    log(`Error: Migration file not found at ${migrationFile}`, colors.red);
    process.exit(1);
  }

  try {
    log('Applying RLS migration...', colors.blue);

    // Read the SQL file
    const sqlContent = fs.readFileSync(migrationFile, 'utf8');

    // Execute the SQL using psql (requires PostgreSQL client to be installed)
    execSync(`psql "${process.env.DIRECT_DATABASE_URL}" -c "${sqlContent.replace(/"/g, '\\"')}"`, {
      stdio: 'inherit',
    });

    log('✓ RLS migration applied successfully!', colors.green);
    console.log('');

    // Verify RLS is enabled
    log('Verifying RLS is enabled...', colors.blue);
    execSync(
      `psql "${process.env.DIRECT_DATABASE_URL}" -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users';"`,
      { stdio: 'inherit' }
    );

    console.log('');
    log('Listing RLS policies...', colors.blue);
    execSync(
      `psql "${process.env.DIRECT_DATABASE_URL}" -c "SELECT schemaname, tablename, policyname, permissive, roles, cmd FROM pg_policies WHERE tablename = 'users';"`,
      { stdio: 'inherit' }
    );

    console.log('');
    log('========================================', colors.green);
    log('Migration Complete!', colors.green);
    log('========================================', colors.green);
  } catch (error) {
    log('✗ Failed to apply RLS migration', colors.red);
    console.error(error.message);
    process.exit(1);
  }
}

main();
