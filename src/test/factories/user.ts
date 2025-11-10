import { User } from "@prisma/client";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

let userIdCounter = 1;

/**
 * Factory function to create mock User objects for testing
 * Usage: const user = createMockUser({ email: 'custom@test.com' })
 */
export function createMockUser(overrides?: Partial<User>): User {
  const id = overrides?.id ?? randomUUID();
  const timestamp = new Date();

  return {
    id,
    email: overrides?.email ?? `user${userIdCounter}@test.com`,
    name: overrides?.name ?? `Test User ${userIdCounter}`,
    createdAt: overrides?.createdAt ?? timestamp,
    updatedAt: overrides?.updatedAt ?? timestamp,
    ...overrides,
  };
}

/**
 * Create multiple mock users
 * Usage: const users = createMockUsers(5)
 */
export function createMockUsers(count: number): User[] {
  return Array.from({ length: count }, () => createMockUser());
}

/**
 * Reset the counter (useful in beforeEach hooks)
 */
export function resetUserFactory() {
  userIdCounter = 1;
}

/**
 * Create a real user in the test database
 * Usage: const user = await createUserFactory()
 */
export async function createUserFactory(overrides?: Partial<User>): Promise<User> {
  const id = overrides?.id ?? randomUUID();
  const timestamp = new Date();

  const user = await prisma.user.create({
    data: {
      id,
      email: overrides?.email ?? `user${userIdCounter++}@test.com`,
      name: overrides?.name ?? `Test User ${userIdCounter}`,
      createdAt: overrides?.createdAt ?? timestamp,
      updatedAt: overrides?.updatedAt ?? timestamp,
    },
  });

  return user;
}
