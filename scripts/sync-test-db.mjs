#!/usr/bin/env node

/**
 * Sync Test Database with Development Schema
 *
 * This script helps you keep your test database in sync with schema changes.
 * It pushes the Prisma schema to the test database and optionally seeds test data.
 *
 * Usage:
 *   npm run db:test:sync           # Push schema only
 *   npm run db:test:sync -- --seed # Push schema and seed data
 */

import { execSync } from "child_process";
import dotenv from "dotenv";

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[36m",
  red: "\x1b[31m",
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function execute(command, description) {
  log(`\n${description}...`, colors.blue);
  try {
    execSync(command, {
      stdio: "inherit",
      env: { ...process.env },
    });
    log(`✅ ${description} complete`, colors.green);
    return true;
  } catch (error) {
    log(`❌ ${description} failed`, colors.red);
    return false;
  }
}

async function main() {
  const shouldSeed = process.argv.includes("--seed");

  log("═══════════════════════════════════════════", colors.bright);
  log("  Test Database Sync Tool", colors.bright);
  log("═══════════════════════════════════════════", colors.bright);

  // Load test environment to verify it exists
  const testEnv = dotenv.config({ path: ".env.test" });

  if (testEnv.error) {
    log("\n❌ Error: .env.test file not found!", colors.red);
    log(
      "Please create .env.test with your test database credentials.",
      colors.yellow
    );
    log(
      'See docs/TEST_DATABASE_SETUP.md for setup instructions.\n',
      colors.yellow
    );
    process.exit(1);
  }

  if (!testEnv.parsed?.DATABASE_URL) {
    log("\n❌ Error: DATABASE_URL not found in .env.test!", colors.red);
    log(
      "Please add your test database connection string to .env.test.",
      colors.yellow
    );
    process.exit(1);
  }

  log("\n📋 Sync Plan:", colors.bright);
  log("  1. Push Prisma schema to test database", colors.reset);
  if (shouldSeed) {
    log("  2. Seed test data", colors.reset);
  }

  log(
    `\n🎯 Target: Test Database (${testEnv.parsed.NEXT_PUBLIC_SUPABASE_URL || "configured in .env.test"})`,
    colors.yellow
  );

  // Step 1: Push schema
  const pushSuccess = execute(
    "dotenv -e .env.test -- npx prisma db push",
    "Pushing schema to test database"
  );

  if (!pushSuccess) {
    log("\n❌ Schema push failed. Aborting sync.", colors.red);
    process.exit(1);
  }

  // Step 2: Seed (if requested)
  if (shouldSeed) {
    const seedSuccess = execute(
      "dotenv -e .env.test -- node scripts/seed-test-db.mjs",
      "Seeding test database"
    );

    if (!seedSuccess) {
      log("\n⚠️  Seeding failed, but schema was synced.", colors.yellow);
    }
  }

  log("\n═══════════════════════════════════════════", colors.green);
  log("  ✅ Test Database Sync Complete!", colors.green);
  log("═══════════════════════════════════════════", colors.green);

  if (shouldSeed) {
    log(
      "\n🎉 Your test database is now synced with the latest schema and seeded with test data.",
      colors.green
    );
  } else {
    log(
      "\n🎉 Your test database is now synced with the latest schema.",
      colors.green
    );
    log(
      '\n💡 Tip: Run with --seed flag to also seed test data:\n   npm run db:test:sync -- --seed\n',
      colors.blue
    );
  }
}

main().catch((error) => {
  log(`\n❌ Unexpected error: ${error.message}`, colors.red);
  process.exit(1);
});
