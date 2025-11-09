import { PrismaClient } from "@prisma/client";
import { mockDeep, mockReset, DeepMockProxy } from "vitest-mock-extended";
import { beforeEach, vi } from "vitest";

// Create a deeply mocked Prisma client
export const prismaMock =
  mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

// Reset all mocks before each test
beforeEach(() => {
  mockReset(prismaMock);
});

// Mock the Prisma module
vi.mock("@/lib/prisma", () => ({
  prisma: prismaMock,
}));
