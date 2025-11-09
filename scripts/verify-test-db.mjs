#!/usr/bin/env node

/**
 * Verify Test Database Setup
 *
 * This script verifies that the test database is properly configured
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

// Load test environment with override to ensure .env.test takes precedence
dotenv.config({ path: ".env.test", override: true });

const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Verifying test database setup...\n");

  // Check connection
  console.log("1️⃣  Testing database connection...");
  try {
    await prisma.$connect();
    console.log("   ✅ Database connection successful\n");
  } catch (error) {
    console.error("   ❌ Database connection failed:", error.message);
    process.exit(1);
  }

  // Check users table
  console.log("2️⃣  Checking users table...");
  try {
    const users = await prisma.user.findMany();
    console.log(`   ✅ Users table exists with ${users.length} records\n`);

    if (users.length > 0) {
      console.log("   Sample users:");
      users.forEach((user) => {
        console.log(`   - ${user.name} (${user.email})`);
      });
      console.log();
    }
  } catch (error) {
    console.error("   ❌ Error querying users table:", error.message);
    process.exit(1);
  }

  // Check RLS policies
  console.log("3️⃣  Checking RLS policies...");
  try {
    const rlsCheck = await prisma.$queryRaw`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public' AND tablename = 'users';
    `;

    if (rlsCheck.length > 0 && rlsCheck[0].rowsecurity) {
      console.log("   ✅ Row-Level Security is enabled on users table\n");
    } else {
      console.log("   ⚠️  Row-Level Security is NOT enabled on users table\n");
    }

    const policies = await prisma.$queryRaw`
      SELECT policyname FROM pg_policies WHERE tablename = 'users';
    `;

    if (policies.length > 0) {
      console.log(`   ✅ Found ${policies.length} RLS policies:`);
      policies.forEach((policy) => {
        console.log(`   - ${policy.policyname}`);
      });
      console.log();
    }
  } catch (error) {
    console.error("   ⚠️  Could not verify RLS policies:", error.message);
  }

  console.log("═══════════════════════════════════════════");
  console.log("✅ Test Database Verification Complete!");
  console.log("═══════════════════════════════════════════");
  console.log("\n📊 Database Summary:");
  console.log(`   Project: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
  console.log(`   Environment: ${process.env.NODE_ENV}`);
  console.log("\n🎯 Ready for testing!");
}

main()
  .catch((e) => {
    console.error("\n❌ Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
