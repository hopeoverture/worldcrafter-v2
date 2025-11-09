#!/usr/bin/env node

/**
 * Apply RLS Policies to Test Database
 *
 * This script applies Row-Level Security policies to the test database
 */

import { execSync } from "child_process";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment
dotenv.config({ path: ".env.test" });

const directUrl = process.env.DIRECT_DATABASE_URL;

if (!directUrl) {
  console.error("❌ DIRECT_DATABASE_URL not found in .env.test");
  process.exit(1);
}

const migrationFile = path.join(__dirname, "..", "prisma", "migrations", "sql", "001_enable_rls.sql");

console.log("🔐 Applying RLS policies to test database...");
console.log(`📄 Migration file: ${migrationFile}`);

try {
  execSync(`psql "${directUrl}" -f "${migrationFile}"`, {
    stdio: "inherit",
  });
  console.log("\n✅ RLS policies applied successfully to test database!");
} catch (error) {
  console.error("\n❌ Failed to apply RLS policies");
  process.exit(1);
}
