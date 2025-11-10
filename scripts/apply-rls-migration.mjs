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
  log('Applying RLS Migrations', colors.blue);
  log('========================================', colors.blue);

  // Check if DIRECT_DATABASE_URL is set
  if (!process.env.DIRECT_DATABASE_URL) {
    log('Error: DIRECT_DATABASE_URL not set in .env file', colors.red);
    log('Please add DIRECT_DATABASE_URL to your .env file', colors.red);
    process.exit(1);
  }

  const migrationFiles = [
    path.join(__dirname, '..', 'prisma', 'migrations', 'sql', '001_enable_rls.sql'),
    path.join(__dirname, '..', 'prisma', 'migrations', 'sql', '002_phase1_rls.sql'),
  ];

  // Check if migration files exist
  for (const migrationFile of migrationFiles) {
    if (!fs.existsSync(migrationFile)) {
      log(`Error: Migration file not found at ${migrationFile}`, colors.red);
      process.exit(1);
    }
  }

  try {
    // Apply each migration file
    for (const migrationFile of migrationFiles) {
      const fileName = path.basename(migrationFile);
      log(`Applying ${fileName}...`, colors.blue);

      // Execute the SQL file using psql -f (requires PostgreSQL client to be installed)
      execSync(`psql "${process.env.DIRECT_DATABASE_URL}" -f "${migrationFile}"`, {
        stdio: 'inherit',
      });

      log(`✓ ${fileName} applied successfully!`, colors.green);
      console.log('');
    }

    // Verify RLS is enabled
    log('Verifying RLS is enabled...', colors.blue);
    execSync(
      `psql "${process.env.DIRECT_DATABASE_URL}" -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('users', 'worlds', 'locations', 'activities');"`,
      { stdio: 'inherit' }
    );

    console.log('');
    log('Listing RLS policies...', colors.blue);
    execSync(
      `psql "${process.env.DIRECT_DATABASE_URL}" -c "SELECT schemaname, tablename, policyname, permissive, roles, cmd FROM pg_policies WHERE tablename IN ('users', 'worlds', 'locations', 'activities') ORDER BY tablename, policyname;"`,
      { stdio: 'inherit' }
    );

    console.log('');
    log('========================================', colors.green);
    log('All Migrations Complete!', colors.green);
    log('========================================', colors.green);
  } catch (error) {
    log('✗ Failed to apply RLS migrations', colors.red);
    console.error(error.message);
    process.exit(1);
  }
}

main();
