#!/usr/bin/env node

/**
 * Seed Test Database
 *
 * This script seeds the test database with sample data for testing
 * Run: npm run db:test:seed
 */

import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { randomUUID } from "crypto";

// Load test environment variables
dotenv.config({ path: ".env.test" });

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding test database...");

  // Clear existing data
  console.log("Clearing existing data...");
  await prisma.user.deleteMany({});

  // Create test users with valid UUIDs
  console.log("Creating test users...");
  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: randomUUID(),
        email: "test1@example.com",
        name: "Test User 1",
      },
    }),
    prisma.user.create({
      data: {
        id: randomUUID(),
        email: "test2@example.com",
        name: "Test User 2",
      },
    }),
  ]);

  console.log(`✅ Created ${users.length} test users`);
  console.log("🌱 Test database seeded successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding test database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
