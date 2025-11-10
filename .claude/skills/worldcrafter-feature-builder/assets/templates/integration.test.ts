import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '@/lib/prisma'
import { createMockUser } from '@/test/factories/user'
import { submitFeature, updateFeature, deleteFeature } from '../actions'

describe('Feature Integration Tests', () => {
  // Store created IDs for cleanup
  const createdIds: string[] = []
  let testUserId: string

  beforeAll(async () => {
    // Create test user if needed
    const testUser = await prisma.user.create({
      data: createMockUser({ email: 'feature-test@example.com' }),
    })
    testUserId = testUser.id
  })

  afterAll(async () => {
    // Clean up created records
    if (createdIds.length > 0) {
      await prisma.yourModel.deleteMany({
        where: { id: { in: createdIds } },
      })
    }

    // Clean up test user
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } })
    }
  })

  describe('submitFeature', () => {
    it('creates record in database', async () => {
      const testData = {
        title: 'Test Feature',
        description: 'Test Description',
      }

      const result = await submitFeature(testData)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data).toMatchObject({
        title: 'Test Feature',
        description: 'Test Description',
      })

      // Store for cleanup
      if (result.data?.id) {
        createdIds.push(result.data.id)
      }

      // Verify in database
      const dbRecord = await prisma.yourModel.findUnique({
        where: { id: result.data!.id },
      })

      expect(dbRecord).toBeTruthy()
      expect(dbRecord?.title).toBe('Test Feature')
    })

    it('validates required fields', async () => {
      const invalidData = {
        title: '', // Empty title should fail
      }

      const result = await submitFeature(invalidData as any)

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('handles database errors gracefully', async () => {
      // Try to create with invalid data that passes validation
      // but fails at database level (e.g., foreign key constraint)
      const invalidData = {
        title: 'Test',
        userId: 'non-existent-user-id',
      }

      const result = await submitFeature(invalidData as any)

      expect(result.success).toBe(false)
    })
  })

  describe('updateFeature', () => {
    let featureId: string

    beforeAll(async () => {
      // Create a feature to update
      const feature = await prisma.yourModel.create({
        data: {
          title: 'Original Title',
          userId: testUserId,
        },
      })
      featureId = feature.id
      createdIds.push(featureId)
    })

    it('updates existing record', async () => {
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
      }

      const result = await updateFeature(featureId, updateData)

      expect(result.success).toBe(true)
      expect(result.data?.title).toBe('Updated Title')

      // Verify in database
      const dbRecord = await prisma.yourModel.findUnique({
        where: { id: featureId },
      })

      expect(dbRecord?.title).toBe('Updated Title')
    })

    it('prevents updating non-existent record', async () => {
      const result = await updateFeature('non-existent-id', {
        title: 'Test',
      })

      expect(result.success).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('requires authentication', async () => {
      // Test without auth context
      const result = await updateFeature(featureId, {
        title: 'Test',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unauthorized')
    })

    it('prevents updating other users records', async () => {
      // Create another user's record
      const otherUser = await prisma.user.create({
        data: createMockUser({ email: 'other@example.com' }),
      })

      const otherFeature = await prisma.yourModel.create({
        data: {
          title: 'Other Feature',
          userId: otherUser.id,
        },
      })
      createdIds.push(otherFeature.id)

      // Try to update with current user's auth
      const result = await updateFeature(otherFeature.id, {
        title: 'Hacked Title',
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Forbidden')

      // Cleanup
      await prisma.user.delete({ where: { id: otherUser.id } })
    })
  })

  describe('deleteFeature', () => {
    it('deletes existing record', async () => {
      // Create a record to delete
      const feature = await prisma.yourModel.create({
        data: {
          title: 'To Delete',
          userId: testUserId,
        },
      })

      const result = await deleteFeature(feature.id)

      expect(result.success).toBe(true)

      // Verify deleted from database
      const dbRecord = await prisma.yourModel.findUnique({
        where: { id: feature.id },
      })

      expect(dbRecord).toBeNull()
    })

    it('prevents deleting non-existent record', async () => {
      const result = await deleteFeature('non-existent-id')

      expect(result.success).toBe(false)
    })

    it('requires authentication', async () => {
      const result = await deleteFeature('some-id')

      expect(result.success).toBe(false)
      expect(result.error).toContain('Unauthorized')
    })
  })
})
