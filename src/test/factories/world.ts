import { World, Genre, Privacy } from "@prisma/client"
import { randomUUID } from "crypto"

let worldIdCounter = 1

/**
 * Factory function to create mock World objects for testing
 * Usage: const world = createMockWorld({ name: 'Custom World' })
 */
export function createMockWorld(overrides?: Partial<World>): World {
  const id = overrides?.id ?? `world-${randomUUID()}`
  const timestamp = new Date()
  const worldNumber = worldIdCounter++

  return {
    id,
    userId: overrides?.userId ?? randomUUID(),
    name: overrides?.name ?? `Test World ${worldNumber}`,
    slug:
      overrides?.slug ??
      `test-world-${worldNumber}-${Math.random().toString(36).substring(2, 8)}`,
    genre: overrides?.genre ?? ("FANTASY" as Genre),
    description:
      overrides?.description ?? `A test world for automated testing - World ${worldNumber}`,
    setting:
      overrides?.setting ??
      `A ${overrides?.genre ?? "fantasy"} setting for testing purposes`,
    metadata: overrides?.metadata ?? null,
    coverUrl: overrides?.coverUrl ?? null,
    privacy: overrides?.privacy ?? ("PRIVATE" as Privacy),
    createdAt: overrides?.createdAt ?? timestamp,
    updatedAt: overrides?.updatedAt ?? timestamp,
    ...overrides,
  }
}

/**
 * Create multiple mock worlds
 * Usage: const worlds = createMockWorlds(5)
 */
export function createMockWorlds(count: number, overrides?: Partial<World>): World[] {
  return Array.from({ length: count }, () => createMockWorld(overrides))
}

/**
 * Reset the counter (useful in beforeEach hooks)
 */
export function resetWorldFactory() {
  worldIdCounter = 1
}
