#!/usr/bin/env node

/**
 * Apply Phase 1 RLS Migration only
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function main() {
  log('Applying Phase 1 RLS Migration', colors.blue);

  if (!process.env.DIRECT_DATABASE_URL) {
    log('Error: DIRECT_DATABASE_URL not set', colors.red);
    process.exit(1);
  }

  const migrationFile = path.join(__dirname, '..', 'prisma', 'migrations', 'sql', '002_phase1_rls.sql');

  if (!fs.existsSync(migrationFile)) {
    log(`Error: Migration file not found at ${migrationFile}`, colors.red);
    process.exit(1);
  }

  try {
    execSync(`psql "${process.env.DIRECT_DATABASE_URL}" -f "${migrationFile}"`, {
      stdio: 'inherit',
    });

    log('✓ Phase 1 RLS migration applied!', colors.green);
  } catch (error) {
    log('✗ Failed to apply migration', colors.red);
    console.error(error.message);
    process.exit(1);
  }
}

main();
